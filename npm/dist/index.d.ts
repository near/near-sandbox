export declare class Binary {
    name: string;
    installDir: string;
    url: URL;
    static readonly DEFAULT_INSTALL_DIR: string;
    protected constructor(name: string, path: URL | string, installDir?: string);
    /**
     *
     * @param name binary name, e.g. 'git'
     * @param path URL of where to find binary
     * @param destination Directory to put the binary
     * @returns
     */
    static create(name: string, path: string | URL, destination?: string): Promise<Binary>;
    get binPath(): string;
    download(): Promise<void>;
    install(): Promise<boolean>;
    exists(): Promise<boolean>;
    run(cliArgs?: string[], options?: {
        stdio: ("inherit" | null)[];
    }): Promise<number>;
    runAndExit(cliArgs?: string[], options?: {
        stdio: ("inherit" | null)[];
    }): Promise<void>;
    uninstall(): Promise<void>;
}
