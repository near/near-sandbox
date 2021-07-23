import { spawn as _spawn, Output }  from "promisify-child-process";
import {ChildProcess, spawn as s} from "child_process";
import { join }  from "path";
import * as fs  from "fs/promises";
import { PathLike } from "fs";
import rimraf from "rimraf";
import { promisify } from "util";
// @ts-ignore
import  getBinary  from "../getBinary";

type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;

const rm = promisify(rimraf);
const runFile: string = getBinary()._getBinaryPath();

async function exists(d: PathLike): Promise<boolean> {
  try { 
    await fs.access(d);
  } catch (e) {
    return false;
  }
  return true;
}

async function spawn(...args: string[]): ChildProcessPromise {
  return _spawn(runFile, args, {encoding: 'utf8'});
}

const readyRegex = /Server listening at ed25519/

class SandboxServer {
  private subprocess!: any;

  private constructor(private homeDir: string){}


  static async init(homeDir: string = "/tmp/near-sandbox"): Promise<SandboxServer> {
    const server = new SandboxServer(homeDir); 
    if (await exists(server.homeDir)) {
      await rm(server.homeDir);
    }
    try {
      let {stderr, code, stdout} = await server.spawn("init");
      // console.log(stdout, code);
      console.error(stderr);
    } catch (e) {

    }
    return server
  }

  private async spawn(command: string): ChildProcessPromise {
    return spawn('--home', this.homeDir, command);
  }

  run(): Promise<SandboxServer> {
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      try {
        this.subprocess = s(runFile, ['--home', this.homeDir, "run"]);
        this.subprocess.stderr.on('data', (data: any) => {
          if (readyRegex.test(`${data}`)) {
            resolve(this);
          }
        });
        this.subprocess.on('exit',() => {
          if (errors) {
            console.error("Server died")
          }
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
    process.exit(0);
  }
}

export async function runServer(): Promise<SandboxServer> {
    const res = await SandboxServer.init();
    return res.run();

}

// try {
//   runServer();
// } catch(e: any) {
//   console.error(e)
// }