declare class SandboxServer {
    private homeDir;
    private subprocess;
    private constructor();
    static init(homeDir?: string): Promise<SandboxServer>;
    private spawn;
    run(): Promise<SandboxServer>;
    close(): void;
}
export declare function runServer(): Promise<SandboxServer>;
export {};
