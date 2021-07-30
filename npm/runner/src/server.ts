import { join } from "path";
import * as http from "http";

import tmpDir from "temp-dir";

import { openSync }from "fs";

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

const pollData = JSON.stringify({
  jsonrpc: "2.0",
  id: "dontcare",
  method: "block",
  params: { finality: "final" },
});

function pingServer(port: number): Promise<boolean> {
  const options = {
    hostname: `0.0.0.0`,
    port,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(pollData),
    },
  };
  return new Promise((resolve, _) => {
    const req  = http.request(options, (res) => {
      if (res.statusCode == 200) {
        resolve(true);
      } else {
        debug(`Sandbox running but got non-200 response: ${JSON.stringify(res)}`)
        resolve(false);
      }
    });
    req.on('error', (e) => {
      debug(e.toString());
      resolve(false);
    });
    
    // Write data to request body
    req.write(pollData);
    debug(`polling server at port ${options.port}`);
    req.end();
  })
}

async function sandboxStarted(port: number, timeout: number = 20_000): Promise<void> {
  const checkUntil = Date.now() + timeout + 250;
  do {
    if (await pingServer(port)) return;
    await new Promise(res => setTimeout(() => res(true), 250));
  } while (Date.now() < checkUntil)
  throw new Error(`Sandbox Server with port: ${port} failed to start after ${timeout}ms`);
}

export class SandboxServer {
  private subprocess!: any;
  private static lastPort = 4000;
  private _config: Config;
  private readyToDie: boolean = false;
  private ready: boolean = false;

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

  async start(): Promise<SandboxServer> {
    const args = [
      "--home",
      this.homeDir,
      "run",
      "--rpc-addr",
      this.internalRpcAddr,
    ];
    debug(`sending args, ${args.join(" ")}`);
    const options: any = {
      stdio: ['ignore', 'ignore', 'ignore']
    };
    if (process.env["SANDBOX_DEBUG"]) {
      const filePath = join(this.homeDir,'sandboxServer.log');
      debug(`near-sandbox logs writing to file: ${filePath}`)
      options.stdio[2] = openSync(filePath, 'a');
      options.env = { RUST_BACKTRACE: 'full'};
    }
    this.subprocess = spawn(sandboxBinary(), args, options);
    this.subprocess.on("exit", () => {
      debug(
        `Server with port ${this.port}: Died ${
          this.readyToDie ? "gracefully" : "horribly"
        }`
      );
    });
    await sandboxStarted(this.port);
    debug(`Connected to server at ${this.internalRpcAddr}`);
    return this; 
  }

  close(): void {
    this.readyToDie = true;
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
