use anyhow::Result;
use near_sandbox_utils::{GenesisAccount, Sandbox, SandboxConfig};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<()> {
    let mut config = SandboxConfig::default();

    config.additional_genesis = Some(json!({
        "epoch_length": 100,
    }));

    config.additional_accounts = vec![
        GenesisAccount {
            account_id: "alice.near".to_string(),
            public_key: "ed25519:AzBN9XwQDRuLvGvor2JnMitkRxBxn2TLY4yEM3othKUF".to_string(),
            private_key: "ed25519:5byt6y8h1uuHwkr2ozfN5gt8xGiHujpcT5KyNhZpG62BrnU51sMQk5eTVNwWp7RRiMgKHp7W1jrByxLCr2apXNGB".to_string(),
            amount: 1_000_000_000_000_000_000_000_000_000_u128,
        },
    ];

    let sandbox = Sandbox::start_sandbox_with_config(config).await?;

    println!("Sandbox is running at: {}", sandbox.rpc_addr);
    println!("Sandbox home directory is: {:?}", sandbox.home_dir);

    tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;

    // The sandbox will be automatically stopped when it goes out of scope

    Ok(())
}
