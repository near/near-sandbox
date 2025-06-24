use std::net::SocketAddrV4;
use std::time::Duration;
use std::{fs::File, net::Ipv4Addr};

use fs2::FileExt;
use tempfile::TempDir;
use tokio::net::TcpListener;
use tokio::process::Child;
use tracing::info;

pub mod config;
pub use config::{GenesisAccount, SandboxConfig};

// Must be an IP address as `neard` expects socket address for network address.
const DEFAULT_RPC_HOST: &str = "127.0.0.1";

fn rpc_socket(port: u16) -> String {
    format!("{DEFAULT_RPC_HOST}:{}", port)
}

/// Request an unused port from the OS.
async fn pick_unused_port() -> anyhow::Result<u16> {
    // Port 0 means the OS gives us an unused port
    // Important to use localhost as using 0.0.0.0 leads to users getting brief firewall popups to
    // allow inbound connections on MacOS.
    let addr = SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0);
    let listener = TcpListener::bind(addr).await?;
    let port = listener.local_addr()?.port();
    Ok(port)
}

/// Acquire an unused port and lock it for the duration until the sandbox server has
/// been started.
async fn acquire_unused_port() -> anyhow::Result<(u16, File)> {
    loop {
        let port = pick_unused_port().await?;
        let lockpath = std::env::temp_dir().join(format!("near-sandbox-port{}.lock", port));
        let lockfile = File::create(lockpath)?;
        if lockfile.try_lock_exclusive().is_ok() {
            break Ok((port, lockfile));
        }
    }
}

/// An sandbox instance that can be used to launch local near network to test against.
///
/// All the [examples](https://github.com/near/near-api-rs/tree/main/examples) are using Sandbox implementation.
///
/// This is work-in-progress and not all the features are supported yet.
pub struct Sandbox {
    pub home_dir: TempDir,
    pub rpc_addr: String,
    pub rpc_port_lock: File,
    pub net_port_lock: File,
    process: Child,
}

impl Sandbox {
    /// Start a new sandbox with the default near-sandbox-utils version.
    pub async fn start_sandbox() -> anyhow::Result<Self> {
        Self::start_sandbox_with_config_and_version(
            SandboxConfig::default(),
            crate::DEFAULT_NEAR_SANDBOX_VERSION,
        )
        .await
    }

    /// Start a new sandbox with the given near-sandbox-utils version.
    ///
    /// # Arguments
    /// * `version` - the version of the near-sandbox-utils to use.
    ///
    pub async fn start_sandbox_with_version(version: &str) -> anyhow::Result<Self> {
        Self::start_sandbox_with_config_and_version(SandboxConfig::default(), version).await
    }

    /// Start a new sandbox with the custom configuration and default version.
    ///
    /// # Arguments
    /// * `config` - custom configuration for the sandbox
    ///
    pub async fn start_sandbox_with_config(config: SandboxConfig) -> anyhow::Result<Self> {
        Self::start_sandbox_with_config_and_version(config, crate::DEFAULT_NEAR_SANDBOX_VERSION)
            .await
    }

    /// Start a new sandbox with a custom configuration and specific near-sandbox-utils version.
    ///
    /// # Arguments
    /// * `config` - custom configuration for the sandbox
    /// * `version` - the version of the near-sandbox-utils to use
    ///
    pub async fn start_sandbox_with_config_and_version(
        config: SandboxConfig,
        version: &str,
    ) -> anyhow::Result<Self> {
        suppress_sandbox_logs_if_required();
        let home_dir = Self::init_home_dir_with_version(version).await?;

        let (rpc_port, rpc_port_lock) = acquire_unused_port().await?;
        let (net_port, net_port_lock) = acquire_unused_port().await?;

        let rpc_addr = rpc_socket(rpc_port);
        let net_addr = rpc_socket(net_port);

        config::set_sandbox_configs_with_config(&home_dir, &config)?;
        config::set_sandbox_genesis_with_config(&home_dir, &config)?;

        let options = &[
            "--home",
            home_dir.path().to_str().expect("home_dir is valid utf8"),
            "run",
            "--rpc-addr",
            &rpc_addr,
            "--network-addr",
            &net_addr,
        ];

        let child = crate::run_with_options_with_version(options, version)?;

        info!(target: "sandbox", "Started up sandbox at localhost:{} with pid={:?}", rpc_port, child.id());

        let rpc_addr = format!("http://{rpc_addr}");

        Self::wait_until_ready(&rpc_addr).await?;

        Ok(Self {
            home_dir,
            rpc_addr,
            rpc_port_lock,
            net_port_lock,
            process: child,
        })
    }

    async fn init_home_dir_with_version(version: &str) -> anyhow::Result<TempDir> {
        let home_dir = tempfile::tempdir()?;

        let output = crate::init_with_version(&home_dir, version)?
            .wait_with_output()
            .await?;
        info!(target: "sandbox", "sandbox init: {:?}", output);

        Ok(home_dir)
    }

    async fn wait_until_ready(rpc: &str) -> anyhow::Result<()> {
        let timeout_secs = match std::env::var("NEAR_RPC_TIMEOUT_SECS") {
            Ok(secs) => secs
                .parse::<u64>()
                .expect("Failed to parse NEAR_RPC_TIMEOUT_SECS"),
            Err(_) => 10,
        };

        let mut interval = tokio::time::interval(Duration::from_millis(500));
        for _ in 0..timeout_secs * 2 {
            interval.tick().await;
            let response = reqwest::get(format!("{}/status", rpc)).await;
            if response.is_ok() {
                return Ok(());
            }
        }
        Err(anyhow::anyhow!(
            "Sandbox didn't start with the provided timeout"
        ))
    }
}

impl Drop for Sandbox {
    fn drop(&mut self) {
        info!(
            target: "sandbox",
            "Cleaning up sandbox: pid={:?}",
            self.process.id()
        );

        self.process.start_kill().expect("failed to kill sandbox");
        let _ = self.process.try_wait();
    }
}

/// Turn off neard-sandbox logs by default. Users can turn them back on with
/// NEAR_ENABLE_SANDBOX_LOG=1 and specify further parameters with the custom
/// NEAR_SANDBOX_LOG for higher levels of specificity. NEAR_SANDBOX_LOG args
/// will be forward into RUST_LOG environment variable as to not conflict
/// with similar named log targets.
fn suppress_sandbox_logs_if_required() {
    if let Ok(val) = std::env::var("NEAR_ENABLE_SANDBOX_LOG") {
        if val != "0" {
            return;
        }
    }

    // non-exhaustive list of targets to suppress, since choosing a default LogLevel
    // does nothing in this case, since nearcore seems to be overriding it somehow:
    std::env::set_var("NEAR_SANDBOX_LOG", "near=error,stats=error,network=error");
}
