"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxServer = exports.getHomeDir = void 0;
const path_1 = require("path");
const temp_dir_1 = __importDefault(require("temp-dir"));
const utils_1 = require("./utils");
const readyRegex = /Server listening at ed25519| stats: /;
function getHomeDir(p = 3000) {
    return path_1.join(temp_dir_1.default, "sandbox", p.toString());
}
exports.getHomeDir = getHomeDir;
// TODO: detemine safe port range
function assertPortRange(p) {
    if (p < 4000 || p > 5000) {
        throw new Error("port is out of range, 3000-3999");
    }
}
class SandboxServer {
    constructor(config) {
        this._config = {
            ...SandboxServer.defaultConfig(),
            ...config,
        };
        assertPortRange(this.port);
    }
    static nextPort() {
        return SandboxServer.lastPort++;
    }
    static defaultConfig() {
        const port = SandboxServer.nextPort();
        return {
            homeDir: getHomeDir(port),
            port,
            init: true,
            rm: false,
            refDir: null,
        };
    }
    get config() {
        return this._config;
    }
    get homeDir() {
        return this.config.homeDir;
    }
    get port() {
        return this.config.port;
    }
    get rpcAddr() {
        return `http://localhost:${this.port}`;
    }
    get internalRpcAddr() {
        return `0.0.0.0:${this.port}`;
    }
    static async init(config) {
        const server = new SandboxServer(config);
        if (server.config.refDir) {
            await utils_1.rm(server.homeDir);
            await utils_1.copyDir(server.config.refDir, server.config.homeDir);
        }
        if ((await utils_1.exists(server.homeDir)) && server.config.init) {
            await utils_1.rm(server.homeDir);
        }
        if (server.config.init) {
            try {
                let { stderr, code } = await server.spawn("init");
                utils_1.debug(stderr);
                if (code && code < 0) {
                    throw new Error("Failed to spawn sandbox server");
                }
            }
            catch (e) {
                // TODO: should this throw?
                console.log(e);
            }
        }
        utils_1.debug("created " + server.homeDir);
        return server;
    }
    async spawn(command) {
        return utils_1.asyncSpawn("--home", this.homeDir, command);
    }
    start() {
        return new Promise((resolve, reject) => {
            try {
                const args = [
                    "--home",
                    this.homeDir,
                    "run",
                    "--rpc-addr",
                    this.internalRpcAddr,
                ];
                utils_1.debug(`sending args, ${args.join(" ")}`);
                this.subprocess = utils_1.spawn(utils_1.sandboxBinary(), args);
                const onData = (data) => {
                    utils_1.debug(`${data}`);
                    if (readyRegex.test(`${data}`)) {
                        setTimeout(() => resolve(this), 2000);
                        this.subprocess.stderr.removeListener("data", onData);
                    }
                };
                this.subprocess.stderr.on("data", onData);
                this.subprocess.on("exit", () => {
                    utils_1.debug(`Server with port ${this.port}: Died`);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    close() {
        if (!this.subprocess.kill("SIGINT")) {
            console.error(`Failed to kill child process with PID: ${this.subprocess.pid}`);
        }
        if (this.config.rm) {
            utils_1.rm(this.homeDir);
        }
    }
}
exports.SandboxServer = SandboxServer;
SandboxServer.lastPort = 4000;
//# sourceMappingURL=server.js.map