import { join } from "path";
import { promises as fs } from "fs";

import BN from "bn.js";
import * as nearAPI from "near-api-js";


import { debug } from "./utils";
import { Config, SandboxServer } from "./server";

export class SandboxRuntime {
  private static networkId = "sandbox";
  private static rootAccountName = "test.near";
  private static readonly INITIAL_DEPOSIT = new BN(10).pow(new BN(25));
  private near: nearAPI.Near;
  private root: Account;
  private masterKey: nearAPI.KeyPair;

  private constructor(
    near: nearAPI.Near,
    root: nearAPI.Account,
    masterKey: nearAPI.KeyPair,
    public homeDir: string
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
    homeDir: string,
    init?: boolean
  ): Promise<SandboxRuntime> {
    const keyFile = require(join(homeDir, "validator_key.json"));
    const masterKey = nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
    const pubKey = masterKey.getPublicKey();
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      homeDir
    );
    if (init) {
      await keyStore.setKey(this.networkId, this.rootAccountName, masterKey);
    }
    const near = await nearAPI.connect({
      keyStore,
      networkId: this.networkId,
      nodeUrl: rpcAddr,
    });
    const root = new nearAPI.Account(near.connection, "test.near");
    const runtime = new SandboxRuntime(near, root, masterKey, homeDir);
    return runtime;
  }

  async createAccount(name: string): Promise<Account> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      SandboxRuntime.networkId
    );
    await this.root.najAccount.createAccount(
      name,
      pubKey,
      new BN(10).pow(new BN(25))
    );
    return this.getAccount(name);
  }

  async createAndDeploy(
    name: string,
    wasm: string,
    initialDeposit: BN = SandboxRuntime.INITIAL_DEPOSIT
  ): Promise<ContractAccount> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      SandboxRuntime.networkId
    );
    const najContractAccount =
      await this.root.najAccount.createAndDeployContract(
        name,
        pubKey,
        await fs.readFile(wasm),
        initialDeposit
      );
    return new ContractAccount(najContractAccount);
  }

  getRoot(): Account {
    return this.root;
  }

  getAccount(name: string): Account {
    return new Account(new nearAPI.Account(this.near.connection, name));
  }

  getContractAccount(name: string): ContractAccount {
    return new ContractAccount(new nearAPI.Account(this.near.connection, name));
  }
}

type Args = { [key: string]: any };

export class Account {
  najAccount: nearAPI.Account;

  constructor(account: nearAPI.Account) {
    this.najAccount = account;
  }

  get connection(): nearAPI.Connection {
    return this.najAccount.connection;
  }

  get accountId(): string {
    return this.najAccount.accountId;
  }

  async call<T>(
    contractId: string,
    methodName: string,
    args: Args = {},
    gas?: BN,
    attachedDeposit?: BN
  ): Promise<any> {
    const oldLog = console.log;
    global.console.log = () => {};
    const ret = await this.najAccount.functionCall({
        contractId,
        methodName,
        args,
        gas,
        attachedDeposit,
      });
    global.console.log = oldLog;
    return ret;
  }

}

export class ContractAccount extends Account {
  async view<T>(method: string, args?: Args): Promise<any> {
    const res:any = await this.connection.provider.query({
      request_type: 'call_function',
      account_id: this.accountId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic'
    });
    if (res.result) {
      res.result = JSON.parse(Buffer.from(res.result).toString())
    }
    return res;
  }
}

export type TestRunnerFn = (s: SandboxRuntime) => Promise<void>;

async function runFunction2(
  configOrFunction: TestRunnerFn | Partial<Config>,
  fn?: TestRunnerFn
): Promise<void> {
  // return runFunction(f)
}

async function runFunction(
  f: TestRunnerFn,
  config?: Partial<Config>
): Promise<SandboxRuntime> {
  let server = await SandboxServer.init(config);
  await server.start(); // Wait until server is ready
  const runtime = await SandboxRuntime.connect(
    server.rpcAddr,
    server.homeDir,
    config?.init
  );
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
  return runtime;
}

export type SandboxRunner = (f: TestRunnerFn) => Promise<void>;

export async function createSandbox(
  setupFn: TestRunnerFn
): Promise<SandboxRunner> {
  const runtime = await runFunction(setupFn, { init: true });
  return async (testFn: TestRunnerFn) => {
    await runFunction(testFn, { refDir: runtime.homeDir, init: false });
  };
}
