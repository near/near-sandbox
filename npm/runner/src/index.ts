import { join } from "path";
import tmpDir from "temp-dir";
import { promises as fs } from "fs";
import BN from "bn.js";

import {
  asyncSpawn,
  ChildProcessPromise,
  debug,
  exists,
  rm,
  spawn,
  copyDir,
} from "./utils";

import * as nearAPI from "near-api-js";

const readyRegex = /Server listening at ed25519/;

interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
}

function getHomeDir(p: number = 3000): string {
  return join(tmpDir, "sandbox", p.toString());
}

// TODO: detemine safe port range
function assertPortRange(p: number): void {
  if (p < 3000 || p > 4000) {
    throw new Error("port is out of range, 3000-3999");
  }
}
class SandboxServer {
  private subprocess!: any;
  private static lastPort = 3000;
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
    return `0.0.0.0:${this.port}`;
  }

  static async init(config?: Partial<Config>): Promise<SandboxServer> {
    const server = new SandboxServer(config);
    if (server.config.refDir) {
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
          this.rpcAddr,
        ];
        debug(`sending args, ${args.join(" ")}`);
        this.subprocess = spawn(...args);
        this.subprocess.stderr.on("data", (data: any) => {
          if (readyRegex.test(`${data}`)) {
            resolve(this);
          }
        });
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

export class SandboxRuntime {
  private static networkId = "sandbox";
  private static rootAccountName = "test.near";
  private near: nearAPI.Near;
  private root: Account;
  private masterKey: nearAPI.KeyPair;

  private constructor(
    near: nearAPI.Near,
    root: nearAPI.Account,
    masterKey: nearAPI.KeyPair,
  ) {
    this.near = near;
    this.root = new Account(root);
    this.masterKey = masterKey;
  }

  get pubKey(): nearAPI.utils.key_pair.PublicKey {
    return this.masterKey.getPublicKey();
  }

  static async connect(
    rpcAddr: string,
    homeDir: string
  ): Promise<SandboxRuntime> {
    const keyFile = require(join(homeDir, "validator_key.json"));
    const masterKey = nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
    const pubKey = masterKey.getPublicKey();
    const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    await keyStore.setKey(this.networkId, this.rootAccountName, masterKey);
    const near = await nearAPI.connect({
      keyStore,
      networkId: this.networkId,
      nodeUrl: rpcAddr,
    });
    const root = new nearAPI.Account(near.connection, "test.near");
    const runtime = new SandboxRuntime(near, root, masterKey);
    return runtime;
  }

  async createAccount(name: string): Promise<Account> {
    await this.root.najAccount.createAccount(
      name,
      this.pubKey,
      new BN(10).pow(new BN(25))
    );
    keyStore.setKey(this.networkId, name, this.masterKey);
    const account = new nearAPI.Account(this.near.connection, name);
    // TODO: rust-status-message has this stuff; do we need it?
    // const accountUseContract = new nearAPI.Contract(
    //   account,
    //   contractAccountId,
    //   contractMethods
    // );
    // const accountUseContract = new nearAPI.Contract(
    //   account,
    //   contractAccountId,
    //   contractMethods
    // );
    return new Account(najAccount);
  }

  async createAndDeploy(name: string, wasm: string): Promise<ContractAccount> {
    const najContractAccount = await this.root.najAccount.createAndDeployContract(
      name,
      this.pubKey,
      await fs.readFile(wasm),
      new BN(10).pow(new BN(25))
    );
    return new ContractAccount(najContractAccount);
  }

  getRoot(): Account {
    return this.root;
  }

  async getAccount(s: string): Promise<Account> { }

}

type Args = { [key: string]: any };

export class Account {
  najAccount: nearAPI.Account;

  constructor(account: nearAPI.Account): Account {
    this.najAccount = account;
  }

  async call<T>(target: string, method: string, args: Args): T { }
}

export class ContractAcount extends Account {
  async view<T>(method: string, args: Args): T { }
}

type TestRunnerFn = (s?: SandboxRuntime) => Promise<void>;

async function runFunction2(
  configOrFunction: TestRunnerFn | Partial<Config>,
  fn?: TestRunnerFn
): Promise<void> {
  // return runFunction(f)
}

async function runFunction(
  f: TestRunnerFn,
  config?: Partial<Config>
): Promise<SandboxServer> {
  let server = await SandboxServer.init(config);
  await server.start(); // Wait until server is ready
  const runtime = new SandboxRuntime(server.rpcAddr);
  try {
    await f(runtime);
  } finally {
    // catch (e){
    //   console.error(e)
    //   throw e;
    // }
    debug("Closing server with port " + server.port);
    server.close();
  }
  return server;
}

type SandboxRunner = (f: TestRunnerFn) => Promise<void>;

export async function createSandbox(
  setupFn: TestRunnerFn
): Promise<SandboxRunner> {
  const server = await runFunction(setupFn);
  return async (testFn: TestRunnerFn) => {
    await runFunction(testFn, { refDir: server.homeDir, init: false });
  };
}
