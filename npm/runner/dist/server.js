"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxServer = exports.getHomeDir = void 0;
const path_1 = require("path");
const http = __importStar(require("http"));
const temp_dir_1 = __importDefault(require("temp-dir"));
const fs_1 = require("fs");
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
const pollData = JSON.stringify({
    jsonrpc: "2.0",
    id: "dontcare",
    method: "block",
    params: { finality: "final" },
});
function pingServer(port) {
    const options = {
        hostname: `0.0.0.0`,
        port,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(pollData),
        },
    };
    return new Promise((resolve, _) => {
        const req = http.request(options, (res) => {
            if (res.statusCode == 200) {
                resolve(true);
            }
            else {
                utils_1.debug(`Sandbox running but got non-200 response: ${JSON.stringify(res)}`);
                resolve(false);
            }
        });
        req.on('error', (e) => {
            utils_1.debug(e.toString());
            resolve(false);
        });
        // Write data to request body
        req.write(pollData);
        utils_1.debug(`polling server at port ${options.port}`);
        req.end();
    });
}
async function sandboxStarted(port, timeout = 20000) {
    const checkUntil = Date.now() + timeout + 250;
    do {
        if (await pingServer(port))
            return;
        await new Promise(res => setTimeout(() => res(true), 250));
    } while (Date.now() < checkUntil);
    throw new Error(`Sandbox Server with port: ${port} failed to start after ${timeout}ms`);
}
class SandboxServer {
    constructor(config) {
        this.readyToDie = false;
        this.ready = false;
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
    async start() {
        const args = [
            "--home",
            this.homeDir,
            "run",
            "--rpc-addr",
            this.internalRpcAddr,
        ];
        utils_1.debug(`sending args, ${args.join(" ")}`);
        const options = {
            stdio: ['ignore', 'ignore', 'ignore']
        };
        if (process.env["SANDBOX_DEBUG"]) {
            const filePath = path_1.join(this.homeDir, 'sandboxServer.log');
            utils_1.debug(`near-sandbox logs writing to file: ${filePath}`);
            options.stdio[2] = fs_1.openSync(filePath, 'a');
            options.env = { RUST_BACKTRACE: 'full' };
        }
        this.subprocess = utils_1.spawn(utils_1.sandboxBinary(), args, options);
        this.subprocess.on("exit", () => {
            utils_1.debug(`Server with port ${this.port}: Died ${this.readyToDie ? "gracefully" : "horribly"}`);
        });
        await sandboxStarted(this.port);
        utils_1.debug(`Connected to server at ${this.internalRpcAddr}`);
        return this;
    }
    close() {
        this.readyToDie = true;
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