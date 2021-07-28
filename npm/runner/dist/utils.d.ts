/// <reference types="node" />
import { PathLike } from "fs";
import { ChildProcess } from "child_process";
import { Output } from "promisify-child-process";
export declare const rm: (arg1: string) => Promise<void>;
export declare const sandboxBinary: string;
export declare function exists(d: PathLike): Promise<boolean>;
export declare type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;
export declare function asyncSpawn(...args: string[]): ChildProcessPromise;
export declare function spawn(...args: string[]): Promise<import("child_process").ChildProcessWithoutNullStreams>;
export declare function debug(s: string | Buffer | null | undefined): void;
export declare const copyDir: Function;
