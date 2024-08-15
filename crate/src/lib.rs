use anyhow::{anyhow, Context};
use binary_install::Cache;
use fs2::FileExt;
use tokio::process::{Child, Command};

use std::fs::File;
use std::path::{Path, PathBuf};

pub mod sync;

// The current version of the sandbox node we want to point to.
// Should be updated to the latest release of nearcore.
// Currently pointing to nearcore@v2.0.0 released on August 5, 2024
pub const DEFAULT_NEAR_SANDBOX_VERSION: &str = "2.0.0";

const fn platform() -> Option<&'static str> {
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    return Some("Linux-x86_64");

    // Darwin-x86_64 is not supported for some time now.
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return None;

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    return Some("Darwin-arm64");

    #[cfg(all(
        not(target_os = "macos"),
        not(all(target_os = "linux", target_arch = "x86_64"))
    ))]
    return None;
}

fn local_addr(port: u16) -> String {
    format!("0.0.0.0:{}", port)
}

// if the `SANDBOX_ARTIFACT_URL` env var is set, we short-circuit and use that.
fn bin_url(version: &str) -> Option<String> {
    if let Ok(val) = std::env::var("SANDBOX_ARTIFACT_URL") {
        return Some(val);
    }

    Some(format!(
        "https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/{}/{}/near-sandbox.tar.gz",
        platform()?,
        version,
    ))
}

// Returns a path to the binary in the form of: `{home}/.near/near-sandbox-{version}` || `{$OUT_DIR}/.near/near-sandbox-{version}`
fn download_path(version: &str) -> PathBuf {
    let mut out = if cfg!(feature = "global_install") {
        home::home_dir().expect("could not retrieve home_dir")
    } else {
        PathBuf::from(env!("OUT_DIR"))
    };

    out.push(".near");
    out.push(format!("near-sandbox-{}", normalize_name(version)));
    if !out.exists() {
        std::fs::create_dir_all(&out).expect("could not create download path");
    }

    out
}

/// Returns a path to the binary in the form of {home}/.near/near-sandbox-{version}/near-sandbox
pub fn bin_path(version: &str) -> anyhow::Result<PathBuf> {
    if let Ok(path) = std::env::var("NEAR_SANDBOX_BIN_PATH") {
        let path = PathBuf::from(path);
        if !path.exists() {
            anyhow::bail!("binary {} does not exist", path.display());
        }
        return Ok(path);
    }

    let mut buf = download_path(version);
    buf.push("near-sandbox");

    Ok(buf)
}

fn normalize_name(input: &str) -> String {
    input.replace('/', "_")
}

/// Install the sandbox node given the version, which is either a commit hash or tagged version
/// number from the nearcore project. Note that commits pushed to master within the latest 12h
/// will likely not have the binaries made available quite yet.
pub fn install_with_version(version: &str) -> anyhow::Result<PathBuf> {
    if let Some(bin_path) = check_for_version(version)? {
        return Ok(bin_path);
    }

    // Download binary into temp dir
    let bin_name = format!("near-sandbox-{}", normalize_name(version));
    let dl_cache = Cache::at(&download_path(version));
    let bin_path = bin_url(version).ok_or_else(|| {
        anyhow!("Unsupported platform: only linux-x86 and darwin-arm are supported")
    })?;
    let dl = dl_cache
        .download(true, &bin_name, &["near-sandbox"], &bin_path)
        .map_err(anyhow::Error::msg)
        .with_context(|| "unable to download near-sandbox")?
        .ok_or_else(|| anyhow!("Could not install near-sandbox"))?;

    let path = dl.binary("near-sandbox").map_err(anyhow::Error::msg)?;

    // Move near-sandbox binary to correct location from temp folder.
    let dest = download_path(version).join("near-sandbox");
    std::fs::rename(path, &dest)?;

    Ok(dest)
}

/// Installs sandbox node with the default version. This is a version that is usually stable
/// and has landed into mainnet to reflect the latest stable features and fixes.
pub fn install() -> anyhow::Result<PathBuf> {
    ensure_sandbox_bin_with_version(DEFAULT_NEAR_SANDBOX_VERSION)
}

fn installable(bin_path: &Path) -> anyhow::Result<Option<std::fs::File>> {
    // Sandbox bin already exists
    if bin_path.exists() {
        return Ok(None);
    }

    let mut lockpath = bin_path.to_path_buf();
    lockpath.set_extension("lock");

    // Acquire the lockfile
    let lockfile = File::create(lockpath)?;
    lockfile.lock_exclusive()?;

    // Check again after acquiring if no one has written to the dest path
    if bin_path.exists() {
        Ok(None)
    } else {
        Ok(Some(lockfile))
    }
}

pub fn ensure_sandbox_bin() -> anyhow::Result<PathBuf> {
    ensure_sandbox_bin_with_version(DEFAULT_NEAR_SANDBOX_VERSION)
}

pub fn run_with_options(options: &[&str]) -> anyhow::Result<Child> {
    let bin_path = crate::ensure_sandbox_bin()?;
    Command::new(&bin_path)
        .args(options)
        .envs(crate::log_vars())
        .spawn()
        .with_context(|| format!("failed to run sandbox using '{}'", bin_path.display()))
}

pub fn run(home_dir: impl AsRef<Path>, rpc_port: u16, network_port: u16) -> anyhow::Result<Child> {
    #[allow(deprecated)]
    run_with_version(
        home_dir,
        rpc_port,
        network_port,
        DEFAULT_NEAR_SANDBOX_VERSION,
    )
}

pub fn init(home_dir: impl AsRef<Path>) -> anyhow::Result<Child> {
    init_with_version(home_dir, DEFAULT_NEAR_SANDBOX_VERSION)
}

pub fn ensure_sandbox_bin_with_version(version: &str) -> anyhow::Result<PathBuf> {
    let mut bin_path = bin_path(version)?;
    if let Some(lockfile) = installable(&bin_path)? {
        bin_path = install_with_version(version)?;
        println!("Installed near-sandbox into {}", bin_path.to_str().unwrap());
        std::env::set_var("NEAR_SANDBOX_BIN_PATH", bin_path.as_os_str());
        lockfile.unlock()?;
    }

    Ok(bin_path)
}

pub fn run_with_options_with_version(options: &[&str], version: &str) -> anyhow::Result<Child> {
    let bin_path = ensure_sandbox_bin_with_version(version)?;
    Command::new(&bin_path)
        .args(options)
        .envs(crate::log_vars())
        .spawn()
        .with_context(|| format!("failed to run sandbox using '{}'", bin_path.display()))
}

pub fn run_with_version(
    home_dir: impl AsRef<Path>,
    rpc_port: u16,
    network_port: u16,
    version: &str,
) -> anyhow::Result<Child> {
    let home_dir = home_dir.as_ref().to_str().unwrap();

    run_with_options_with_version(
        &[
            "--home",
            home_dir,
            "run",
            "--rpc-addr",
            &local_addr(rpc_port),
            "--network-addr",
            &local_addr(network_port),
        ],
        version,
    )
}

/// Initialize a sandbox node with the provided version and home directory.
pub fn init_with_version(home_dir: impl AsRef<Path>, version: &str) -> anyhow::Result<Child> {
    let bin_path = ensure_sandbox_bin_with_version(version)?;
    let home_dir = home_dir.as_ref().to_str().unwrap();
    Command::new(&bin_path)
        .envs(log_vars())
        .args(["--home", home_dir, "init", "--fast"])
        .spawn()
        .with_context(|| format!("failed to init sandbox using '{}'", bin_path.display()))
}

fn log_vars() -> Vec<(String, String)> {
    let mut vars = Vec::new();
    if let Ok(val) = std::env::var("NEAR_SANDBOX_LOG") {
        vars.push(("RUST_LOG".into(), val));
    }
    if let Ok(val) = std::env::var("NEAR_SANDBOX_LOG_STYLE") {
        vars.push(("RUST_LOG_STYLE".into(), val));
    }
    vars
}

/// Check if the sandbox version is already downloaded to the bin path.
/// It does not disambiguate between a commit hash and a tagged version, so it's recommeded to
/// pick one format and stick to it.
fn check_for_version(version: &str) -> anyhow::Result<Option<PathBuf>> {
    // short circuit if we are using the sandbox binary from the environment
    if let Ok(bin_path) = &std::env::var("NEAR_SANDBOX_BIN_PATH") {
        return Ok(Some(PathBuf::from(bin_path)));
    }

    // version saved under {home}/.near/near-sandbox-{version}/near-sandbox
    let out_dir = download_path(version).join("near-sandbox");
    if !out_dir.exists() {
        return Ok(None);
    }

    Ok(Some(out_dir))
}
