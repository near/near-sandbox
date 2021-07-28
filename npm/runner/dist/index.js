"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSandbox = void 0;
const path_1 = require("path");
const temp_dir_1 = __importDefault(require("temp-dir"));
const utils_1 = require("./utils");
const readyRegex = /Server listening at ed25519/;
function getHomeDir(p = 3000) {
    return path_1.join(temp_dir_1.default, 'sandbox', p.toString());
}
// TODO: detemine safe port range
function assertPortRange(p) {
    if (p < 3000 || p > 4000) {
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
            refDir: null
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
        return `0.0.0.0:${this.port}`;
    }
    static async init(config) {
        const server = new SandboxServer(config);
        if (server.config.refDir) {
            await utils_1.copyDir(server.config.refDir, server.config.homeDir);
        }
        if (await utils_1.exists(server.homeDir) && server.config.init) {
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
        return utils_1.asyncSpawn('--home', this.homeDir, command);
    }
    start() {
        return new Promise((resolve, reject) => {
            try {
                const args = ['--home', this.homeDir, "run", "--rpc-addr", this.rpcAddr];
                utils_1.debug(`sending args, ${args.join(" ")}`);
                this.subprocess = utils_1.spawn(...args);
                this.subprocess.stderr.on('data', (data) => {
                    if (readyRegex.test(`${data}`)) {
                        resolve(this);
                    }
                });
                this.subprocess.on('exit', () => {
                    utils_1.debug(`Server with port ${this.port}: Died`);
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
            utils_1.rm(this.homeDir);
        }
    }
}
SandboxServer.lastPort = 3000;
class SandboxRuntime {
    constructor(rpcAddr) {
        this.rpcAddr = rpcAddr;
    }
}
async function runFunction2(configOrFunction, fn) {
    // return runFunction(f)
}
async function runFunction(f, config) {
    let server = await SandboxServer.init(config);
    await server.start(); // Wait until server is ready
    const runtime = new SandboxRuntime(server.rpcAddr);
    try {
        await f(runtime);
    }
    // catch (e){
    //   console.error(e)
    //   throw e;
    // } 
    finally {
        utils_1.debug("Closing server with port " + server.port);
        server.close();
    }
    return server;
}
async function createSandbox(setupFn) {
    const server = await runFunction(setupFn);
    return async (testFn) => {
        await runFunction(testFn, { refDir: server.homeDir, init: false });
    };
}
exports.createSandbox = createSandbox;
;
//# sourceMappingURL=index.js.map