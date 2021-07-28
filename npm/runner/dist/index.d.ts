declare class SandboxRuntime {
    private rpcAddr;
    constructor(rpcAddr: string);
}
declare type TestRunnerFn = (s?: SandboxRuntime) => Promise<void>;
declare type SandboxRunner = (f: TestRunnerFn) => Promise<void>;
export declare function createSandbox(setupFn: TestRunnerFn): Promise<SandboxRunner>;
export {};
