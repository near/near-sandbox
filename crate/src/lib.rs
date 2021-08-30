use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::hash::{Hash, Hasher};

use anyhow::anyhow;
use binary_install::Cache;
use siphasher::sip::SipHasher13;

const fn platform() -> &'static str {
    #[cfg(target_os = "linux")]
    return "Linux";

    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return "Darwin";

    #[cfg(all(not(all(target_os = "macos", target_arch = "x86_64")), not(target_os = "linux")))]
    compile_error!("Unsupported platform");
}

fn local_addr(port: u16) -> String {
    format!("0.0.0.0:{}", port)
}

// HACK: Taken from binary-install to get generated dir
fn hashed_dirname(url: &str, name: &str) -> String {
    let mut hasher = SipHasher13::new();
    url.hash(&mut hasher);
    let result = hasher.finish();
    let hex = hex::encode(&[
        (result >> 0) as u8,
        (result >> 8) as u8,
        (result >> 16) as u8,
        (result >> 24) as u8,
        (result >> 32) as u8,
        (result >> 40) as u8,
        (result >> 48) as u8,
        (result >> 56) as u8,
    ]);
    format!("{}-{}", name, hex)
}

fn bin_url() -> String {
    format!(
        "https://cloudflare-ipfs.com/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG/{}-near-sandbox.tar.gz",
        platform(),
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
    buf.push(hashed_dirname(&bin_url(), "near-sandbox"));
    buf.push("near-sandbox");
    std::env::set_var("NEAR_SANDBOX_BIN_PATH", buf.as_os_str());

    buf
}

pub fn install() -> anyhow::Result<PathBuf> {
    println!("Installing near-sandbox into {}", bin_path().to_str().unwrap());
    let dl_cache = Cache::at(&download_path());
    let dl = dl_cache.download(
        true,
        "near-sandbox",
        &["near-sandbox"],
        &bin_url(),
    )
    .map_err(|e| anyhow::Error::msg(e))?
    .ok_or_else(|| anyhow!("Could not install near-sandbox"))?;

    dl.binary("near-sandbox")
        .map_err(|e| anyhow::Error::msg(e))
}

pub fn ensure_sandbox_bin() -> anyhow::Result<PathBuf> {
    let mut bin_path = bin_path();
    if !bin_path.exists() {
        bin_path = install()?;
        std::env::set_var("NEAR_SANDBOX_BIN_PATH", bin_path.as_os_str());
    }
    Ok(bin_path)
}

pub fn run_with_options(options: &[&str]) -> anyhow::Result<Child> {
    let bin_path = ensure_sandbox_bin()?;
    if cfg!(target_os = "windows") {
        Command::new(bin_path)
            .args(options)
            .spawn()
            .map_err(Into::into)
    } else {
        let mut cmd = Command::new(bin_path);
        for arg in options {
            cmd.arg(arg);
        }

        cmd.spawn().map_err(Into::into)
    }
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
    if cfg!(target_os = "windows") {
        Command::new(bin_path)
            .args(&["--home", home_dir, "init"])
            .spawn()
            .map_err(Into::into)
    } else {
        Command::new(bin_path)
            .arg("--home")
            .arg(home_dir)
            .arg("init")
            .spawn()
            .map_err(Into::into)
    }
}
