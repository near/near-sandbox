<div align="center">
  <h1>NEAR Sandbox</h1>

  <p>
    <strong>Programmable way to run and configure local <code>near-sandbox</code> binary</strong>
  </p>
</div>

## Implementations

| Platform               | Repository                                                 | Latest Release                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rust                   | [near-sandbox-rs](https://github.com/near/near-sandbox-rs) | <a href="https://crates.io/crates/near-sandbox"><img src="https://img.shields.io/crates/v/near-sandbox.svg?style=flat-square" alt="`near-sandbox-rs` Latest Release Version" /></a> |
| TypeScript, JavaScript | [near-sandbox-js](https://github.com/near/near-sandbox-js) | <a href="https://npmjs.com/near-sandbox"><img src="https://img.shields.io/npm/v/near-sandbox.svg?style=flat-square" alt="`near-sandbox-js` Latest Release Version" /></a>                       |

## What is NEAR Sandbox?

**NEAR Sandbox** is a lightweight interface for running and configuring a local NEAR blockchain node instance.  
It is designed for NEAR protocol contributors, integration testers, and application developers who need a reliable and programmable environment for testing interactions with the NEAR blockchain, with minimal dependencies.

NEAR Sandbox is essentially a [custom build](https://github.com/near/nearcore/blob/9f5e20b29f1a15a00fc50d6051b3b44bb6db60b6/Makefile#L67-L69) of the NEAR blockchain node (`neard` from [@near/nearcore](https://github.com/near/nearcore/tree/main/neard)), optimized for local development, testing, and automation. If you're familiar with [Ganache for Ethereum](https://www.trufflesuite.com/ganache), this is similar.
It provides an easy way to launch and control a local NEAR RPC endpoint, enabling the simulation and management of blockchain state for development and CI/CD workflows.

For language-specific usage, installation, and API documentation, please refer to the relevant implementation repositories listed above.
