interface Config {
    homeDir: string;
    port: number;
    init: boolean;
    rm: boolean;
}
declare class SandboxServer {
    private _config?;
    private subprocess;
    private static lastPort;
    private config;
    private static nextPort;
    private static defaultConfig;
    private constructor();
    get homeDir(): string;
    get port(): number;
    get rpcAddr(): string;
    static init(config?: Partial<Config>): Promise<SandboxServer>;
    private spawn;
    run(): Promise<SandboxServer>;
    close(): void;
}
export declare function runFunction(f: (s?: SandboxServer) => Promise<void>, config?: Partial<Config>): Promise<void>;
export {};
