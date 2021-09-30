"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Binary = void 0;
const fs = require("fs/promises");
const path_1 = require("path");
const tar = require("tar");
const got_1 = require("got");
const utils_1 = require("./utils");
const child_process_1 = require("child_process");
const stream = require("stream");
const util_1 = require("util");
const pipeline = (0, util_1.promisify)(stream.pipeline);
class Binary {
    constructor(name, path, installDir = Binary.DEFAULT_INSTALL_DIR) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "installDir", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: installDir
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        let errors = [];
        if (!name || typeof name !== "string") {
            errors.push("You must specify the name of your binary as a string");
        }
        try {
            this.url = new URL(path);
        }
        catch (e) {
            errors.push(e);
        }
        if (errors.length > 0) {
            errors.push('\nCorrect usage: new Binary("my-binary", "https://example.com/binary/download.tar.gz"');
            errors.unshift("One or more of the parameters you passed to the Binary constructor are invalid:\n");
            throw new Error(errors.join("\n"));
        }
    }
    /**
     *
     * @param name binary name, e.g. 'git'
     * @param path URL of where to find binary
     * @param destination Directory to put the binary
     * @returns
     */
    static async create(name, path, destination) {
        const bin = new Binary(name, path, destination !== null && destination !== void 0 ? destination : (await (0, utils_1.searchPath)(name)));
        if (destination === bin.installDir) {
            await fs.mkdir(bin.installDir, { recursive: true });
        }
        return bin;
    }
    get binPath() {
        return (0, path_1.join)(this.installDir, this.name);
    }
    download() {
        return pipeline(got_1.default.stream(this.url), new stream.PassThrough(), tar.x({ strip: 1, C: this.installDir }));
    }
    async install() {
        try {
            await this.download();
        }
        catch (error) {
            throw new Error(`Failed to download binary ${this.url.toString()}`);
        }
        return true;
    }
    async exists() {
        return await (0, utils_1.fileExists)(this.binPath);
    }
    async run(cliArgs, options = { stdio: [null, utils_1.inherit, utils_1.inherit] }) {
        if (!(await this.exists())) {
            try {
                await this.install();
            }
            catch (err) {
                console.error(err);
                return 1;
            }
        }
        const args = cliArgs !== null && cliArgs !== void 0 ? cliArgs : process.argv.slice(2);
        const result = (0, child_process_1.spawn)(this.binPath, args, options);
        result.on("error", (error) => {
            console.log(error);
        });
        return new Promise((resolve, reject) => {
            result.on("close", (code) => {
                if (!code) {
                    resolve(code !== null && code !== void 0 ? code : 0);
                }
                reject(code);
            });
        });
    }
    async runAndExit(cliArgs, options = { stdio: [null, utils_1.inherit, utils_1.inherit] }) {
        process.exit(await this.run(cliArgs, options));
    }
}
exports.Binary = Binary;
Object.defineProperty(Binary, "DEFAULT_INSTALL_DIR", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, path_1.join)(__dirname, "..", "bin")
});
