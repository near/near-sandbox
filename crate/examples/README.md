# NEAR Sandbox Examples

This directory contains examples demonstrating how to use the NEAR Sandbox for local development and testing.

## Examples

### Custom Configuration

[`custom_config.rs`](./custom_config.rs) - Shows how to customize the sandbox configuration, including:

- Adjusting system parameters like max payload size and open files
- Adding custom accounts with predefined balances and keys
- Extending the genesis configuration with custom settings
- Adding additional JSON configuration

## Running Examples

To run an example:

```bash
cargo run --example custom_config
```

## API Overview

The NEAR Sandbox allows for flexible configuration through the `SandboxConfig` struct:

```rust
// Create a custom configuration
let mut config = SandboxConfig::default();

// Set custom configuration values
config.max_payload_size = Some(2 * 1024 * 1024 * 1024); // 2GB payload size
config.max_open_files = Some(5000); // 5000 open files

// Add additional accounts with balances and keys
config.additional_accounts = vec![
    GenesisAccount {
        account_id: "alice.near".to_string(),
        public_key: "ed25519:5YtGLREu8aEQd4RsXjJx5oKQJzCbmz5SQQve9BQjmDH6".to_string(),
        private_key: "ed25519:2LU9CnSwDexQMbP2kQPrCUVUf4azyCtwkYMFyoWxbiaweP3gkLjqBZ8jH1XLNnp3MAspAKtPmd8tC3ukpJyMYx7R".to_string(),
        amount: 1_000_000_000_000_000_000_000_000_000_u128, // 1000 NEAR
    },
];

// Start the sandbox with custom configuration
let sandbox = Sandbox::start_sandbox_with_config(config, "0.6.1").await?;
```