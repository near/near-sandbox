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
exports.runServer = void 0;
const promisify_child_process_1 = require("promisify-child-process");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const rimraf_1 = __importDefault(require("rimraf"));
const util_1 = require("util");
// @ts-ignore
const getBinary_1 = __importDefault(require("../getBinary"));
const rm = util_1.promisify(rimraf_1.default);
console.log(getBinary_1.default());
const runFile = getBinary_1.default().binaryPath;
async function exists(d) {
    try {
        await fs.access(d);
    }
    catch (e) {
        return false;
    }
    return true;
}
async function spawn(...args) {
    return promisify_child_process_1.spawn(runFile, args, { encoding: 'utf8' });
}
const readyRegex = /Server listening at ed25519/;
class SandboxServer {
    constructor(homeDir) {
        this.homeDir = homeDir;
    }
    static async init(homeDir = "/tmp/near-sandbox") {
        const server = new SandboxServer(homeDir);
        if (await exists(server.homeDir)) {
            await rm(server.homeDir);
        }
        try {
            let { stderr, code, stdout } = await server.spawn("init");
            // console.log(stdout, code);
            console.error(stderr);
        }
        catch (e) {
        }
        return server;
    }
    async spawn(command) {
        return spawn('--home', this.homeDir, command);
    }
    run() {
        const errors = [];
        return new Promise((resolve, reject) => {
            try {
                this.subprocess = child_process_1.spawn(runFile, ['--home', this.homeDir, "run"]);
                this.subprocess.stderr.on('data', (data) => {
                    if (readyRegex.test(`${data}`)) {
                        resolve(this);
                    }
                });
                this.subprocess.on('exit', () => {
                    if (errors) {
                        console.error("Server died");
                    }
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
        process.exit(0);
    }
}
async function runServer() {
    const res = await SandboxServer.init();
    return res.run();
}
exports.runServer = runServer;
// try {
//   runServer();
// } catch(e: any) {
//   console.error(e)
// }
//# sourceMappingURL=index.js.map