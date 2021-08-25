use std::io;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};

use binary_install::Cache;
use siphasher::sip::SipHasher13;
use std::hash::{Hash, Hasher};


#[cfg(target_os = "linux")]
const fn platform() -> &'static str {
    "Linux"
}

#[cfg(all(target_os = "macos", target_arch = "x86_64"))]
const fn platform() -> &'static str {
    "Darwin"
}

#[cfg(all(not(all(target_os = "macos", target_arch = "x86_64")), not(target_os = "linux")))]
const fn platform() -> &'static str {
    compile_error!("Unsupported platform");
}

fn local_rpc_addr(port: u16) -> String {
    format!("0.0.0.0:{}", port)
}

// HACK: Taken from binary-install to get generated temp_dir generated
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
    let mut buf = std::env::temp_dir();
    buf.push("near");
    buf
}

pub fn bin_path() -> io::Result<PathBuf> {
    if let Ok(path) = std::env::var("NEAR_SANDBOX_BIN_PATH") {
        return Ok(PathBuf::from(path));
    }

    let mut buf = download_path();
    buf.push(hashed_dirname(&bin_url(), "near-sandbox"));
    buf.push("near-sandbox");
    std::env::set_var("NEAR_SANDBOX_BIN_PATH", buf.as_os_str());

    Ok(buf)
}

pub fn install() -> io::Result<PathBuf> {
    let dl_cache = Cache::at(&download_path());
    let dl = dl_cache.download(
        true,
        "near-sandbox",
        &["near-sandbox"],
        &bin_url(),
    )
    .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?
    .ok_or_else(|| io::Error::new(io::ErrorKind::Other, format!("Unable to download near-sandbox")))?;

    dl.binary("near-sandbox")
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))
}

pub fn ensure_sandbox_bin() -> io::Result<PathBuf> {
    let mut bin_path = bin_path()?;
    if !bin_path.exists() {
        bin_path = install()?;
        std::env::set_var("NEAR_SANDBOX_BIN_PATH", bin_path.as_os_str());
    }
    Ok(bin_path)
}

pub fn start(home_dir: impl AsRef<Path>, port: u16) -> io::Result<Child> {
    let bin_path = ensure_sandbox_bin()?;
    let home_dir = home_dir.as_ref().to_str().unwrap();
    if cfg!(target_os = "windows") {
        Command::new(bin_path)
            .args(&[
                "--home",
                home_dir,
                "run",
                "--rpc-addr",
                &local_rpc_addr(port),
            ])
            .spawn()
    } else {
        Command::new(bin_path)
            .arg("--home")
            .arg(home_dir)
            .arg("run")
            .arg("--rpc-addr")
            .arg(&local_rpc_addr(port))
            .spawn()
    }
}

pub fn init(home_dir: impl AsRef<Path>) -> io::Result<Child> {
    let bin_path = ensure_sandbox_bin()?;
    let home_dir = home_dir.as_ref().to_str().unwrap();
    if cfg!(target_os = "windows") {
        Command::new(bin_path)
            .args(&["--home", home_dir, "init"])
            .spawn()
    } else {
        Command::new(bin_path)
            .arg("--home")
            .arg(home_dir)
            .arg("init")
            .spawn()
    }
}
