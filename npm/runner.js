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
const promisify_child_process_1 = require("promisify-child-process");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs = __importStar(require("fs/promises"));
const rimraf_1 = __importDefault(require("rimraf"));
const util_1 = require("util");
const rm = util_1.promisify(rimraf_1.default);
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
    return promisify_child_process_1.spawn(path_1.join(__dirname, "run.js"), args, { encoding: 'utf8' });
}
class SandboxServer {
    constructor(homeDir) {
        this.homeDir = homeDir;
    }
    static async init(homeDir = "/tmp/sandbox") {
        const server = new SandboxServer(homeDir);
        if (await exists(server.homeDir)) {
            await rm(server.homeDir);
        }
        let { stderr, code, stdout } = await server.spawn("init");
        console.log(stdout, code);
        console.error(stderr);
        return server;
    }
    async spawn(command) {
        return spawn('--home', this.homeDir, command);
    }
    run() {
        try {
            this.subprocess = child_process_1.spawn(path_1.join(__dirname, "run.js"), ['--home', this.homeDir, "run"]);
            this.subprocess.stderr.on('data', (data) => console.log(`${data}`));
            this.subprocess.stdout.on('data', (data) => console.log(`${data}`));
            this.subprocess.on('exit', () => {
                console.log("died");
            });
        }
        catch (e) {
            console.log(e);
        }
        return this;
    }
    close() {
        console.log(this.subprocess.kill('SIGTERM'));
    }
}
async function runServer() {
    const res = await SandboxServer.init();
    res.run();
    setTimeout(() => {
        res.close();
        process.exit(0);
    }, 3000);
}
runServer();
//# sourceMappingURL=runner.js.map