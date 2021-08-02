import * as fs  from "fs/promises";
import { PathLike } from "fs";
import { promisify } from "util";
import {ChildProcess, spawn as _spawn} from "child_process";

import { spawn as _asyncSpawn, Output }  from "promisify-child-process";
import rimraf from "rimraf";
// @ts-ignore
import  getBinary  from "near-sandbox/getBinary";
import fs_extra from "fs-extra";

export const rm = promisify(rimraf);

export const sandboxBinary: () => string = () => getBinary().binaryPath;

export async function exists(d: PathLike): Promise<boolean> {
  try { 
    await fs.access(d);
  } catch (e) {
    return false;
  }
  return true;
}

export type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;

export async function asyncSpawn(...args: string[]): ChildProcessPromise {
  debug(`Sandbox Binary found: ${sandboxBinary()}`);
  return _asyncSpawn(sandboxBinary(), args, {encoding: 'utf8'});
}

// export async function spawn(...args: string[]) {
//   console.log(sandboxBinary())
//   console.log(getBinary().binaryPath)
//   return _;
// }
export {_spawn as spawn}

export function debug(s: string | Buffer | null | undefined): void {
  if (process.env["SANDBOX_DEBUG"]) {
    console.error(s);
  }
}

export const copyDir = promisify(fs_extra.copy);
