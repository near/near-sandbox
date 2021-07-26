import { spawn as _spawn, Output }  from "promisify-child-process";
import {ChildProcess, spawn} from "child_process";
import * as os from "os";
import { join }  from "path";
import * as fs  from "fs/promises";
import { PathLike } from "fs";
import rimraf from "rimraf";
import { promisify } from "util";
import tmpDir from "temp-dir";
// @ts-ignore
import  getBinary  from "../getBinary";

type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;

const rm = promisify(rimraf);

const runFile: string = getBinary().binaryPath;

function debug(s: string | Buffer | null | undefined): void {
  if (process.env["SANDBOX_DEBUG"]) {
    console.error(s);
  }
}


async function exists(d: PathLike): Promise<boolean> {
  try { 
    await fs.access(d);
  } catch (e) {
    return false;
  }
  return true;
}

async function asyncSpawn(...args: string[]): ChildProcessPromise {
  return _spawn(runFile, args, {encoding: 'utf8'});
}

const readyRegex = /Server listening at ed25519/

interface Config {
  homeDir: string,
  port: number,
  init: boolean,
  rm: boolean,
}

function getHomeDir(p: number = 3000): string {
  return join(tmpDir, 'sandbox', p.toString())
}

const DefaultConfig = {
  homeDir: getHomeDir(),
  port: 3000,
  init: true,
  rm: false
}

function assertPortRange(p: number): void {
  if (p < 3000 || p > 4000) {
    throw new Error("port is out of range, 3000-3999")
  }
}
class SandboxServer {
  private subprocess!: any;
  private static lastPort = 3000;
  private config: Config;

  private static nextPort(): number {
    return SandboxServer.lastPort++;
  }

  private static defaultConfig(): Config {
    const port = SandboxServer.nextPort();
    return {
      homeDir: getHomeDir(port),
      port,
      init: true,
      rm: false
    }
  }

  private constructor(private _config?: Partial<Config>){
    this.config = Object.assign({}, SandboxServer.defaultConfig(), _config);
    assertPortRange(this.port);
  }

  get homeDir(): string {
    return this.config.homeDir;
  }

  get port(): number {
    return this.config.port;
  }

  get rpcAddr(): string {
    return `0.0.0.0:${this.port}`;
  }

  static async init(config?: Partial<Config>): Promise<SandboxServer> {
    const server = new SandboxServer(config);
    if (await exists(server.homeDir) && server.config.init) {
      await rm(server.homeDir);
    }
    if (server.config.init) {
      try {
        let {stderr, code} = await server.spawn("init");
        debug(stderr);
        if (code && code < 0) {
          throw new Error("Failed to spawn sandbox server");
        }
      } catch (e) {
        console.log(e)
      }
    }
    debug("created " + server.homeDir)
    return server
  }

  private async spawn(command: string): ChildProcessPromise {
    return asyncSpawn('--home', this.homeDir, command);
  }

  run(): Promise<SandboxServer> {
    return new Promise((resolve, reject) => {
      try {
        const args = ['--home', this.homeDir, "run", "--rpc-addr", this.rpcAddr];
        debug(`sending args, ${args.join(" ")}`)
        this.subprocess = spawn(runFile, args);
        this.subprocess.stderr.on('data', (data: any) => {
          if (readyRegex.test(`${data}`)) {
            resolve(this);
          }
        });
        this.subprocess.on('exit',() => {
          debug(`Server with port ${this.port}: Died`);
        });
        } catch (e: any) {
          reject(e);
        }
    })
    
  }

  close(): void {
    if (!this.subprocess.kill('SIGINT')) {
      console.error(`Failed to kill child process with PID: ${this.subprocess.pid}`)
    }
    if (this.config.rm) {
      rm(this.homeDir);
    }
  }
}

export async function runFunction(f:  (s?: SandboxServer) => Promise<void>, config?: Partial<Config>): Promise<void> {
  let server = await SandboxServer.init(config);
  try {
    await f(await server.run());
  } catch (e){
    console.error(e)
    console.error("Closing server with port " + server.port);
  } finally {
    server.close();
  }
}
