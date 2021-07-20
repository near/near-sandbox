#!/usr/bin/env node

const getBinary = require('./getBinary');
const join = require("path").join;
const fs = require("fs");

const binary = getBinary();
const binPath = join(binary.installDirectory, "bin", binary.name);

function binExists() {
  return fs.existsSync(binPath);
}

function run() {
  if (process.argv.length < 3) {
    process.argv.push("--help");
  }
  binary.run();
}

function install() {
  binary.install().then(() => {
    setTimeout(function() {
      fs.exists(binPath, (exists) => {
        if (!exists) {
          throw new Error("binary failed to be installed to " + binPath);
        }
        run();
      });
  }, 1000);
  });
}

if (!binExists()) {
  install();
} else {
  run();
}
