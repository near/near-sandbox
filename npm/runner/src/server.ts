import { join } from "path";

import tmpDir from "temp-dir";

import { 
  debug,
  asyncSpawn,
  ChildProcessPromise,
  exists,
  rm,
  spawn,
  copyDir,
  sandboxBinary,
} from "./utils";



const readyRegex = /Server listening at ed25519| stats: /;

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
}

export function getHomeDir(p: number = 3000): string {
  return join(tmpDir, "sandbox", p.toString());
}

// TODO: detemine safe port range
function assertPortRange(p: number): void {
  if (p < 4000 || p > 5000) {
    throw new Error("port is out of range, 3000-3999");
  }
}
export class SandboxServer {
  private subprocess!: any;
  private static lastPort = 4000;
  private _config: Config;

  private static nextPort(): number {
    return SandboxServer.lastPort++;
  }

  private static defaultConfig(): Config {
    const port = SandboxServer.nextPort();
    return {
      homeDir: getHomeDir(port),
      port,
      init: true,
      rm: false,
      refDir: null,
    };
  }

  private constructor(config?: Partial<Config>) {
    this._config = {
      ...SandboxServer.defaultConfig(),
      ...config,
    };
    assertPortRange(this.port);
  }

  get config(): Config {
    return this._config;
  }

  get homeDir(): string {
    return this.config.homeDir;
  }

  get port(): number {
    return this.config.port;
  }

  get rpcAddr(): string {
    return `http://localhost:${this.port}`;
  }

  private get internalRpcAddr(): string {
    return `0.0.0.0:${this.port}`;
  }

  static async init(config?: Partial<Config>): Promise<SandboxServer> {
    const server = new SandboxServer(config);
    if (server.config.refDir) {
      await rm(server.homeDir);
      await copyDir(server.config.refDir, server.config.homeDir);
    }
    if ((await exists(server.homeDir)) && server.config.init) {
      await rm(server.homeDir);
    }
    if (server.config.init) {
      try {
        let { stderr, code } = await server.spawn("init");
        debug(stderr);
        if (code && code < 0) {
          throw new Error("Failed to spawn sandbox server");
        }
      } catch (e) {
        // TODO: should this throw?
        console.log(e);
      }
    }
    debug("created " + server.homeDir);
    return server;
  }

  private async spawn(command: string): ChildProcessPromise {
    return asyncSpawn("--home", this.homeDir, command);
  }

  start(): Promise<SandboxServer> {
    return new Promise((resolve, reject) => {
      try {
        const args = [
          "--home",
          this.homeDir,
          "run",
          "--rpc-addr",
          this.internalRpcAddr,
        ];
        debug(`sending args, ${args.join(" ")}`);
        this.subprocess = spawn(sandboxBinary(), args);
        const onData = (data: any) => {
          debug(`${data}`);
          if (readyRegex.test(`${data}`)) {
            setTimeout(() => resolve(this), 2000);
            this.subprocess.stderr.removeListener("data", onData)
          }
        }
        this.subprocess.stderr.on("data", onData);
        this.subprocess.on("exit", () => {
          debug(`Server with port ${this.port}: Died`);
        });
      } catch (e: any) {
        reject(e);
      }
    });
  }

  close(): void {
    if (!this.subprocess.kill("SIGINT")) {
      console.error(
        `Failed to kill child process with PID: ${this.subprocess.pid}`
      );
    }
    if (this.config.rm) {
      rm(this.homeDir);
    }
  }
}