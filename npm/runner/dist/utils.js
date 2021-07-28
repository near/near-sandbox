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
exports.copyDir = exports.debug = exports.spawn = exports.asyncSpawn = exports.exists = exports.sandboxBinary = exports.rm = void 0;
const fs = __importStar(require("fs/promises"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const promisify_child_process_1 = require("promisify-child-process");
const rimraf_1 = __importDefault(require("rimraf"));
// @ts-ignore
const getBinary_1 = __importDefault(require("near-sandbox/getBinary"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.rm = util_1.promisify(rimraf_1.default);
exports.sandboxBinary = getBinary_1.default().binaryPath;
async function exists(d) {
    try {
        await fs.access(d);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.exists = exists;
async function asyncSpawn(...args) {
    return promisify_child_process_1.spawn(exports.sandboxBinary, args, { encoding: 'utf8' });
}
exports.asyncSpawn = asyncSpawn;
async function spawn(...args) {
    return child_process_1.spawn(exports.sandboxBinary, args);
}
exports.spawn = spawn;
function debug(s) {
    if (process.env["SANDBOX_DEBUG"]) {
        console.error(s);
    }
}
exports.debug = debug;
exports.copyDir = util_1.promisify(fs_extra_1.default.copy);
//# sourceMappingURL=utils.js.map