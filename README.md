# NEAR Sandbox

NEAR Sandbox lets you easily run a local NEAR blockchain.

NEAR Sandbox is a [custom build](https://github.com/near/nearcore/blob/9f5e20b29f1a15a00fc50d6051b3b44bb6db60b6/Makefile#L67-L69) of the NEAR blockchain optimized for local development and testing. If you're familiar with [Ganache for Ethereum](https://www.trufflesuite.com/ganache), this is similar.

This repository contains code to quickly install pre-built binaries of NEAR Sandbox for multiple programming languages (currently just NodeJS; Rust coming soon) and operating systems (currently just Intel-based Macs and Debian/Ubuntu-flavored Linux distros using Intel processors).

# Using NEAR Sandbox

If you just want to run tests against a NEAR Sandbox instance, check out [near-runner](https://github.com/near/runner) for your favorite language:
- [JavaScript](https://github.com/near/runner-js)
- Rust (coming soon)

Tip: `near-runner` includes `near-sandbox` as a dependency, so you will not need to install or run `near-sandbox` on its own.

If you want to run NEAR Sandbox on its own, continue reading.

## Install

### With [npm](https://www.npmjs.com/)

    npm i -g near-sandbox

### With Rust

Coming soon

### From Source

* Install [Rust with correct build target](https://docs.near.org/docs/tutorials/contracts/intro-to-rust#3-step-rust-installation)

* Clone [nearcore](https://github.com/near/nearcore)

      git clone https://github.com/near/nearcore

* `cd` into your `nearcore` folder and run `make sandbox`

      cd nearcore
      make sandbox

* For ease-of-use, you can copy (or [symlink](https://kb.iu.edu/d/abbe)) the binary to somewhere in your [PATH](https://www.cloudsavvyit.com/1933/what-is-the-unix-path-and-how-do-you-add-programs-to-it/). For example, if you have a `~/bin` folder:

      cp target/debug/near-sandbox ~/bin/

## Use

* Initialize the Sandbox node

      near-sandbox --home /tmp/near-sandbox init

* Run it

      near-sandbox --home /tmp/near-sandbox run

To find out other things you can do:

    near-sandbox --help

## Stop

Once you're finished using the sandbox node you can stop it by using <kbd>Ctrl</kbd><kbd>C</kbd>. To clean up the data it generates:

    rm -rf /tmp/near-sandbox
