"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBinary = exports.AWSUrl = void 0;
const _1 = require(".");
const path_1 = require("path");
const os = require("os");
function getOSTypes() {
    return [os.type(), os.arch()];
}
function getVersion() {
    const [osType, osArch] = getOSTypes();
    if ((osType === "Linux" || osType === "Darwin") && osArch === "x64") {
        return "master/97c0410de519ecaca369aaee26f0ca5eb9e7de06";
    }
    else if (osType === "Darwin" && osArch === "arm64") {
        return "VLAD-test/c90ac67bc16ba9acbd43104eeb1ba73b6600cca9";
    }
    throw new Error(`Unsupported platform: ${osType} ${osArch}`);
}
function getPlatform() {
    const [osType, osArch] = getOSTypes();
    if ((osType === "Linux" || osType === "Darwin") && osArch === "x64") {
        return [osType, "x86_64"];
    }
    else if (osType === "Darwin" && osArch === "arm64") {
        return [osType, osArch];
    }
    throw new Error(`Unsupported platform: ${osType} ${osArch}`);
}
function AWSUrl() {
    const [platform, arch] = getPlatform();
    const version = getVersion();
    return `https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/${platform}-${arch}/${version}/near-sandbox.tar.gz`;
}
exports.AWSUrl = AWSUrl;
function getBinary(name = "near-sandbox") {
    if (!process.env["NEAR_SANDBOX_BIN_PATH"]) {
        process.env["NEAR_SANDBOX_BINARY_PATH"] = (0, path_1.join)(os.homedir(), ".near", "sandbox");
    }
    // Will use version after publishing to AWS
    // const version = require("./package.json").version;
    const fromEnv = process.env["SANDBOX_ARTIFACT_URL"];
    const urls = [AWSUrl()];
    if (fromEnv) {
        urls.unshift(fromEnv);
    }
    return _1.Binary.create(name, urls);
}
exports.getBinary = getBinary;
