export interface Config {
    homeDir: string;
    port: number;
    init: boolean;
    rm: boolean;
    refDir: string | null;
}
export declare function getHomeDir(p?: number): string;
export declare class SandboxServer {
    private subprocess;
    private static lastPort;
    private _config;
    private static nextPort;
    private static defaultConfig;
    private constructor();
    get config(): Config;
    get homeDir(): string;
    get port(): number;
    get rpcAddr(): string;
    private get internalRpcAddr();
    static init(config?: Partial<Config>): Promise<SandboxServer>;
    private spawn;
    start(): Promise<SandboxServer>;
    close(): void;
}
