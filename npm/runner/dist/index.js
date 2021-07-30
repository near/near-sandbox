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
const fs_1 = require("fs");
const bn_js_1 = __importDefault(require("bn.js"));
const nearAPI = __importStar(require("near-api-js"));
const utils_1 = require("./utils");
const server_1 = require("./server");
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
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(homeDir);
        if (init) {
            await keyStore.setKey(this.networkId, this.rootAccountName, masterKey);
        }
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
    get connection() {
        return this.najAccount.connection;
    }
    get accountId() {
        return this.najAccount.accountId;
    }
    async call(contractId, methodName, args = {}, gas, attachedDeposit) {
        const ret = await this.najAccount.functionCall({
            contractId,
            methodName,
            args,
            gas,
            attachedDeposit,
        });
        return ret;
    }
}
exports.Account = Account;
class ContractAccount extends Account {
    async view(method, args = {}) {
        const res = await this.connection.provider.query({
            request_type: 'call_function',
            account_id: this.accountId,
            method_name: method,
            args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
            finality: 'optimistic'
        });
        if (res.result) {
            res.result = JSON.parse(Buffer.from(res.result).toString());
        }
        return res;
    }
}
exports.ContractAccount = ContractAccount;
async function runFunction2(configOrFunction, fn) {
    // return runFunction(f)
}
async function runFunction(f, config) {
    const server = await server_1.SandboxServer.init(config);
    try {
        await server.start(); // Wait until server is ready
        const runtime = await SandboxRuntime.connect(server.rpcAddr, server.homeDir, config === null || config === void 0 ? void 0 : config.init);
        await f(runtime);
        return runtime;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
    finally {
        utils_1.debug("Closing server with port " + server.port);
        server.close();
    }
}
async function createSandbox(setupFn) {
    const runtime = await runFunction(setupFn, { init: true });
    return async (testFn) => {
        await runFunction(testFn, { refDir: runtime.homeDir, init: false });
    };
}
exports.createSandbox = createSandbox;
//# sourceMappingURL=index.js.map