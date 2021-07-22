import { spawn as _spawn, Output }  from "promisify-child-process";
import {ChildProcess, spawn as s} from "child_process";
import { join }  from "path";
import * as fs  from "fs/promises";
import { PathLike } from "fs";
import rimraf from "rimraf";
import { promisify } from "util";

type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;

const rm = promisify(rimraf);

async function exists(d: PathLike): Promise<boolean> {
  try { 
    await fs.access(d);
  } catch (e) {
    return false;
  }
  return true;
}

async function spawn(...args: string[]): ChildProcessPromise {
  return _spawn(join(__dirname, "run.js"), args, {encoding: 'utf8'});
}

class SandboxServer {
  private subprocess!: any;

  private constructor(private homeDir: string){}


  static async init(homeDir: string = "/tmp/sandbox"): Promise<SandboxServer> {
    const server = new SandboxServer(homeDir); 
    if (await exists(server.homeDir)) {
      await rm(server.homeDir);
    }
    let {stderr, code, stdout} = await server.spawn("init");
    console.log(stdout, code);
    console.error(stderr);
    return server
  }

  private async spawn(command: string): ChildProcessPromise {
    return spawn('--home', this.homeDir, command);
  }

  run(): SandboxServer {
    try {
    this.subprocess = s(join(__dirname, "run.js"), ['--home', this.homeDir, "run"]);
    this.subprocess.stderr.on('data', (data: any) => console.log(`${data}`));
    this.subprocess.stdout.on('data', (data: any) => console.log(`${data}`));
    this.subprocess.on('exit',() => {
      console.log("died")
    })
    } catch (e: any) {
      console.log(e)
    }
    return this;
  }

  close(): void {
    console.log(this.subprocess.kill('SIGTERM'));
  }
}

async function runServer() {
    const res = await SandboxServer.init();
    res.run();
    setTimeout(() => {
      res.close();
      process.exit(0);
    }, 3000);
  
  
}

runServer();