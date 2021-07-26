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
exports.runFunction = void 0;
const promisify_child_process_1 = require("promisify-child-process");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs = __importStar(require("fs/promises"));
const rimraf_1 = __importDefault(require("rimraf"));
const util_1 = require("util");
const temp_dir_1 = __importDefault(require("temp-dir"));
// @ts-ignore
const getBinary_1 = __importDefault(require("../getBinary"));
const rm = util_1.promisify(rimraf_1.default);
const runFile = getBinary_1.default().binaryPath;
function debug(s) {
    if (process.env["SANDBOX_DEBUG"]) {
        console.error(s);
    }
}
async function exists(d) {
    try {
        await fs.access(d);
    }
    catch (e) {
        return false;
    }
    return true;
}
async function asyncSpawn(...args) {
    return promisify_child_process_1.spawn(runFile, args, { encoding: 'utf8' });
}
const readyRegex = /Server listening at ed25519/;
function getHomeDir(p = 3000) {
    return path_1.join(temp_dir_1.default, 'sandbox', p.toString());
}
const DefaultConfig = {
    homeDir: getHomeDir(),
    port: 3000,
    init: true,
    rm: false
};
function assertPortRange(p) {
    if (p < 3000 || p > 4000) {
        throw new Error("port is out of range, 3000-3999");
    }
}
class SandboxServer {
    constructor(_config) {
        this._config = _config;
        this.config = Object.assign({}, SandboxServer.defaultConfig(), _config);
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
            rm: false
        };
    }
    get homeDir() {
        return this.config.homeDir;
    }
    get port() {
        return this.config.port;
    }
    get rpcAddr() {
        return `0.0.0.0:${this.port}`;
    }
    static async init(config) {
        const server = new SandboxServer(config);
        if (await exists(server.homeDir) && server.config.init) {
            await rm(server.homeDir);
        }
        if (server.config.init) {
            try {
                let { stderr, code } = await server.spawn("init");
                debug(stderr);
                if (code && code < 0) {
                    throw new Error("Failed to spawn sandbox server");
                }
            }
            catch (e) {
                console.log(e);
            }
        }
        debug("created " + server.homeDir);
        return server;
    }
    async spawn(command) {
        return asyncSpawn('--home', this.homeDir, command);
    }
    run() {
        return new Promise((resolve, reject) => {
            try {
                const args = ['--home', this.homeDir, "run", "--rpc-addr", this.rpcAddr];
                debug(`sending args, ${args.join(" ")}`);
                this.subprocess = child_process_1.spawn(runFile, args);
                this.subprocess.stderr.on('data', (data) => {
                    if (readyRegex.test(`${data}`)) {
                        resolve(this);
                    }
                });
                this.subprocess.on('exit', () => {
                    debug(`Server with port ${this.port}: Died`);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    close() {
        if (!this.subprocess.kill('SIGINT')) {
            console.error(`Failed to kill child process with PID: ${this.subprocess.pid}`);
        }
        if (this.config.rm) {
            rm(this.homeDir);
        }
    }
}
SandboxServer.lastPort = 3000;
async function runFunction(f, config) {
    let server = await SandboxServer.init(config);
    try {
        await f(await server.run());
    }
    catch (e) {
        console.error(e);
        console.error("Closing server with port " + server.port);
    }
    finally {
        server.close();
    }
}
exports.runFunction = runFunction;
//# sourceMappingURL=index.js.map