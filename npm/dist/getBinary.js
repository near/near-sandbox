"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBinary = void 0;
const _1 = require(".");
const path_1 = require("path");
const os = require("os");
function getPlatform() {
    const type = os.type();
    const arch = os.arch();
    if (type === "Linux" && arch === "x64")
        return "Linux";
    if (type === "Darwin" && arch === "x64")
        return "Darwin";
    throw new Error(`Unsupported platform: ${type} ${arch}`);
}
function getBinary(name = "near-sandbox") {
    var _a;
    const NEAR_SANDBOX_BIN_PATH = (_a = process.env["NEAR_SANDBOX_BIN_PATH"]) !== null && _a !== void 0 ? _a : (0, path_1.join)(os.homedir(), ".near", "sandbox");
    const PATH = process.env["PATH"];
    process.env["PATH"] = `${NEAR_SANDBOX_BIN_PATH}:${PATH}`;
    const platform = getPlatform();
    // Will use version after publishing to AWS
    // const version = require("./package.json").version;
    const fromEnv = process.env["SANDBOX_ARTIFACT_URL"];
    const baseUrl = [
        "https://ipfs.io/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG",
        "https://cloudflare-ipfs.com/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG",
    ];
    if (fromEnv) {
        baseUrl.unshift(fromEnv);
    }
    const url = `${baseUrl}/${platform}-${name}.tar.gz`;
    return _1.Binary.create(name, url);
}
exports.getBinary = getBinary;
