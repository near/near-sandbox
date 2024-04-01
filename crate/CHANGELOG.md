# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.1](https://github.com/near/near-sandbox/compare/v0.7.0...v0.7.1) - 2024-04-01

### Added
- Update default nearcore version to v1.38.0 ([#81](https://github.com/near/near-sandbox/pull/81))
- use tokio instead of async-process as dependants use tokio runtime anyway ([#68](https://github.com/near/near-sandbox/pull/68))
- Expose DEFAULT_NEAR_SANDBOX_VERSION const
- run sandbox instance with --fast flag ([#56](https://github.com/near/near-sandbox/pull/56))
- Allow to specify verion of neard-sandbox ([#63](https://github.com/near/near-sandbox/pull/63))
- add aws link to rust crate ([#18](https://github.com/near/near-sandbox/pull/18))
- near-sandbox cargo crate for installing sandbox

### Fixed
- pin async-process crate ([#66](https://github.com/near/near-sandbox/pull/66))

### Other
- use SANDBOX_ARTIFACT_URL ([#74](https://github.com/near/near-sandbox/pull/74))
- 0.7.0 ([#69](https://github.com/near/near-sandbox/pull/69))
- release ([#67](https://github.com/near/near-sandbox/pull/67))
- Fixed linting warnings
- point nearcore to latest mainnet release 1.35.0 ([#61](https://github.com/near/near-sandbox/pull/61))
- Update crate/Cargo.toml
- update dependencies
- bump versions and update npm package
- update nearcore version
- Bump version
- Improve error message
- Bump sandbox to include fix for log spamming stats
- Bump sandbox(crate) to 0.5.1
- Added back minor removed items
- Fix install collision when running from multiple threads
- Bump Cargo crate + NPM package versions
- Bump sandbox to latest nearcore: Aug 29 2022
- Bump crate/npm versions
- Bump nearcore bin to fix macos overflow
- Bump version of sandbox to supported M1
- Support M1
- Use pre-release version instead
- Fixed using incorrect env var bin path installing
- 0.4
- Bumped version numbers
- Bump sandbox version to nearcore 1.26
- Merge pull request [#33](https://github.com/near/near-sandbox/pull/33) from near/update/sandbox-version
- Bump to latest master due to no mac-os tag release
- Bump crate to 0.2
- Bump nearcore version to latest 1.25.0 release
- Added some docs for install function
- Added install_with_version for sandbox crate
- Bump for 0.1.2 sandbox crate release
- Add NEAR_SANDBOX_LOG_STYLE to forward RUST_LOG_STYLE
- Added custom log env var
- Added environment variables to sandbox
- Release 0.1.1 for crate
- Create temp folders to install into
- Update format for license
- Added MIT license
- Added changes for cargo publish
- Swapped clouflare link to ipfs.io
- Renamed to start -> run
- Added anyhow
- Single platform fn
- Update crate name to sandbox-utils
- Added global_install feature flag
- Use /.near instead of /tmp/near for install path

## [0.6.3](https://github.com/near/sandbox/compare/v0.6.2...v0.6.3) - 2023-09-30

### Added
- Expose DEFAULT_NEAR_SANDBOX_VERSION const
- run sandbox instance with --fast flag ([#56](https://github.com/near/sandbox/pull/56))
- Allow to specify verion of neard-sandbox ([#63](https://github.com/near/sandbox/pull/63))

### Other
- Fixed linting warnings
- point nearcore to latest mainnet release 1.35.0 ([#61](https://github.com/near/sandbox/pull/61))
- Update crate/Cargo.toml
- update dependencies
