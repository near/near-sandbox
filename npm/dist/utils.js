"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rm = exports.inherit = exports.searchPath = exports.fileExists = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
async function fileExists(s) {
    try {
        const f = await (0, promises_1.stat)(s);
        return f.isFile();
    }
    catch {
        return false;
    }
}
exports.fileExists = fileExists;
async function searchPath(filename) {
    var _a, _b;
    const paths = (_b = (_a = process.env["PATH"]) === null || _a === void 0 ? void 0 : _a.split(":")) !== null && _b !== void 0 ? _b : [];
    const priorityPath = process.env['LOCAL_BINARY_PATH'];
    if (priorityPath && priorityPath.length > 0) {
        paths.unshift(priorityPath);
    }
    for (const p of paths) {
        if (await fileExists((0, path_1.join)(p, filename)))
            return p;
    }
    return undefined;
}
exports.searchPath = searchPath;
exports.inherit = 'inherit';
async function rm(path) {
    try {
        await (0, promises_1.rm)(path);
    }
    catch (e) { }
}
exports.rm = rm;
