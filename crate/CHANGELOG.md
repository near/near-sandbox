# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.13.0](https://github.com/near/near-sandbox/compare/v0.12.0...v0.13.0) - 2024-12-17

### Other

- [**breaking**] updates near-sandbox to nearcore 2.4.0 (#106)

## [0.12.0](https://github.com/near/near-sandbox/compare/v0.11.0...v0.12.0) - 2024-11-15

### Other

- Updated near-sandbox version to 2.3.1 version ([#103](https://github.com/near/near-sandbox/pull/103))

## [0.11.0](https://github.com/near/near-sandbox/compare/v0.10.0...v0.11.0) - 2024-09-06

### Other
- Updates near-sandbox to 2.1.1 ([#93](https://github.com/near/near-sandbox/pull/93))

## [0.10.0](https://github.com/near/near-sandbox/compare/v0.9.0...v0.10.0) - 2024-08-15

### Other
- [**breaking**] updated neard to 2.0.0 ([#88](https://github.com/near/near-sandbox/pull/88))

## [0.9.0](https://github.com/near/near-sandbox/compare/v0.8.0...v0.9.0) - 2024-07-05

### Added
- Avoid different versions of near-sandbox binaries collision ([#72](https://github.com/near/near-sandbox/pull/72))

### Other
- Updated the default neard version to 1.40.0 ([#85](https://github.com/near/near-sandbox/pull/85))

## [0.8.0](https://github.com/near/near-sandbox/compare/v0.7.0...v0.8.0) - 2024-06-11

### Added
- Update default nearcore version to v1.38.0 ([#81](https://github.com/near/near-sandbox/pull/81))

## [0.7.0](https://github.com/near/near-sandbox/compare/v0.6.3...v0.7.0) - 2023-10-04

### Added
- use tokio instead of async-process as dependants use tokio runtime anyway ([#68](https://github.com/near/near-sandbox/pull/68))

### Fixed
- pin async-process crate ([#66](https://github.com/near/near-sandbox/pull/66))

### Other
- use SANDBOX_ARTIFACT_URL ([#74](https://github.com/near/near-sandbox/pull/74))

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
