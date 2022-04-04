use std::path::{Path, PathBuf};
use std::process::{Child, Command};

use anyhow::anyhow;
use binary_install::Cache;
use chrono::Utc;

// The current version of the sandbox node we want to point to. This can be updated from
// time to time, but probably should be close to when a release is made.
const DEFAULT_SANDBOX_COMMIT_HASH: &str = "1.25.0/9b3d6ba551f561a028f0216051e031bc2ba0c6b7";

const fn platform() -> &'static str {
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    return "Linux-x86_64";

    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return "Darwin-x86_64";

    #[cfg(all(
        not(all(target_os = "macos", target_arch = "x86_64")),
        not(all(target_os = "linux", target_arch = "x86_64"))
    ))]
    compile_error!("Unsupported platform");
}

fn local_addr(port: u16) -> String {
    format!("0.0.0.0:{}", port)
}

fn bin_url(version: &str) -> String {
    format!(
        "https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/{}/{}/near-sandbox.tar.gz",
        platform(),
        version,
    )
}

fn download_path() -> PathBuf {
    if cfg!(features = "global_install") {
        let mut buf = home::home_dir().expect("could not retrieve home_dir");
        buf.push(".near");
        buf
    } else {
        PathBuf::from(env!("OUT_DIR"))
    }
}

/// Returns a path to the binary in the form of {home}/.near/near-sandbox-{hash}/near-sandbox
pub fn bin_path() -> PathBuf {
    if let Ok(path) = std::env::var("NEAR_SANDBOX_BIN_PATH") {
        return PathBuf::from(path);
    }

    let mut buf = download_path();
    buf.push("near-sandbox");
    std::env::set_var("NEAR_SANDBOX_BIN_PATH", buf.as_os_str());

    buf
}

/// Install the sandbox node given the version, which is either a commit hash or tagged version
/// number from the nearcore project. Note that commits pushed to master within the latest 12h
/// will likely not have the binaries made available quite yet.
pub fn install_with_version(version: &str) -> anyhow::Result<PathBuf> {
    // Download binary into temp dir
    let tmp_dir = format!("near-sandbox-{}", Utc::now());
    let dl_cache = Cache::at(&download_path());
    let dl = dl_cache
        .download(true, &tmp_dir, &["near-sandbox"], &bin_url(version))
        .map_err(anyhow::Error::msg)?
        .ok_or_else(|| anyhow!("Could not install near-sandbox"))?;

    let path = dl.binary("near-sandbox").map_err(anyhow::Error::msg)?;

    // Move near-sandbox binary to correct location from temp folder.
    let dest = download_path().join("near-sandbox");
    std::fs::rename(path, &dest)?;

    Ok(dest)
}

/// Installs sandbox node with the default version. This is a version that is usually stable
/// and has landed into mainnet to reflect the latest stable features and fixes.
pub fn install() -> anyhow::Result<PathBuf> {
    install_with_version(DEFAULT_SANDBOX_COMMIT_HASH)
}

pub fn ensure_sandbox_bin() -> anyhow::Result<PathBuf> {
    let mut bin_path = bin_path();
    if !bin_path.exists() {
        bin_path = install()?;
        println!("Installed near-sandbox into {}", bin_path.to_str().unwrap());
        std::env::set_var("NEAR_SANDBOX_BIN_PATH", bin_path.as_os_str());
    }
    Ok(bin_path)
}

pub fn run_with_options(options: &[&str]) -> anyhow::Result<Child> {
    let bin_path = ensure_sandbox_bin()?;
    Command::new(bin_path)
        .args(options)
        .envs(log_vars())
        .spawn()
        .map_err(Into::into)
}

pub fn run(home_dir: impl AsRef<Path>, rpc_port: u16, network_port: u16) -> anyhow::Result<Child> {
    let home_dir = home_dir.as_ref().to_str().unwrap();
    run_with_options(&[
        "--home",
        home_dir,
        "run",
        "--rpc-addr",
        &local_addr(rpc_port),
        "--network-addr",
        &local_addr(network_port),
    ])
}

pub fn init(home_dir: impl AsRef<Path>) -> anyhow::Result<Child> {
    let bin_path = ensure_sandbox_bin()?;
    let home_dir = home_dir.as_ref().to_str().unwrap();
    Command::new(bin_path)
        .envs(log_vars())
        .args(&["--home", home_dir, "init"])
        .spawn()
        .map_err(Into::into)
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
