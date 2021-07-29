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
exports.createSandbox = exports.ContractAccount = exports.Account = exports.SandboxRuntime = void 0;
const path_1 = require("path");
const temp_dir_1 = __importDefault(require("temp-dir"));
const fs_1 = require("fs");
const bn_js_1 = __importDefault(require("bn.js"));
const utils_1 = require("./utils");
const nearAPI = __importStar(require("near-api-js"));
const readyRegex = /Server listening at ed25519| stats: /;
function getHomeDir(p = 3000) {
    return path_1.join(temp_dir_1.default, "sandbox", p.toString());
}
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
                this.subprocess.stderr.on("data", (data) => {
                    utils_1.debug(`${data}`);
                    if (readyRegex.test(`${data}`)) {
                        resolve(this);
                    }
                });
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
SandboxServer.lastPort = 4000;
class SandboxRuntime {
    constructor(near, root, masterKey, homeDir) {
        this.homeDir = homeDir;
        this.near = near;
        this.root = new Account(root);
        this.masterKey = masterKey;
    }
    get pubKey() {
        return this.masterKey.getPublicKey();
    }
    static async connect(rpcAddr, homeDir, init) {
        const keyFile = require(path_1.join(homeDir, "validator_key.json"));
        const masterKey = nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key);
        const pubKey = masterKey.getPublicKey();
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(homeDir);
        if (init) {
            await keyStore.setKey(this.networkId, this.rootAccountName, masterKey);
        }
        console.log('keyStore', keyStore);
        const near = await nearAPI.connect({
            keyStore,
            networkId: this.networkId,
            nodeUrl: rpcAddr,
        });
        const root = new nearAPI.Account(near.connection, "test.near");
        const runtime = new SandboxRuntime(near, root, masterKey, homeDir);
        return runtime;
    }
    async createAccount(name) {
        const pubKey = await this.near.connection.signer.createKey(name, SandboxRuntime.networkId);
        await this.root.najAccount.createAccount(name, pubKey, new bn_js_1.default(10).pow(new bn_js_1.default(25)));
        return this.getAccount(name);
    }
    async createAndDeploy(name, wasm, initialDeposit = SandboxRuntime.INITIAL_DEPOSIT) {
        const pubKey = await this.near.connection.signer.createKey(name, SandboxRuntime.networkId);
        const najContractAccount = await this.root.najAccount.createAndDeployContract(name, pubKey, await fs_1.promises.readFile(wasm), initialDeposit);
        return new ContractAccount(najContractAccount);
    }
    getRoot() {
        return this.root;
    }
    getAccount(name) {
        return new Account(new nearAPI.Account(this.near.connection, name));
    }
    getContractAccount(name) {
        return new ContractAccount(new nearAPI.Account(this.near.connection, name));
    }
}
exports.SandboxRuntime = SandboxRuntime;
SandboxRuntime.networkId = "sandbox";
SandboxRuntime.rootAccountName = "test.near";
SandboxRuntime.INITIAL_DEPOSIT = new bn_js_1.default(10).pow(new bn_js_1.default(25));
class Account {
    constructor(account) {
        this.najAccount = account;
    }
    async call(contractId, methodName, args = {}, gas, attachedDeposit) {
        return (await this.najAccount.functionCall({
            contractId,
            methodName,
            args,
            gas,
            attachedDeposit,
        })).transaction_outcome.outcome;
    }
}
exports.Account = Account;
class ContractAccount extends Account {
    async view(method, args) {
        return ((await this.najAccount.viewFunction(this.najAccount.accountId, method, args)).transaction_outcome.outcome);
    }
}
exports.ContractAccount = ContractAccount;
async function runFunction2(configOrFunction, fn) {
    // return runFunction(f)
}
async function runFunction(f, config) {
    let server = await SandboxServer.init(config);
    await server.start(); // Wait until server is ready
    const runtime = await SandboxRuntime.connect(server.rpcAddr, server.homeDir, config === null || config === void 0 ? void 0 : config.init);
    try {
        await f(runtime);
    }
    finally {
        // catch (e){
        //   console.error(e)
        //   throw e;
        // }
        utils_1.debug("Closing server with port " + server.port);
        server.close();
    }
    return runtime;
}
async function createSandbox(setupFn) {
    const runtime = await runFunction(setupFn, { init: true });
    return async (testFn) => {
        await runFunction(testFn, { refDir: runtime.homeDir, init: false });
    };
}
exports.createSandbox = createSandbox;
//# sourceMappingURL=index.js.map