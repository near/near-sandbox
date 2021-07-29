import BN from "bn.js";
import * as nearAPI from "near-api-js";
export declare class SandboxRuntime {
    homeDir: string;
    private static networkId;
    private static rootAccountName;
    private static readonly INITIAL_DEPOSIT;
    private near;
    private root;
    private masterKey;
    private constructor();
    get pubKey(): nearAPI.utils.key_pair.PublicKey;
    static connect(rpcAddr: string, homeDir: string, init?: boolean): Promise<SandboxRuntime>;
    createAccount(name: string): Promise<Account>;
    createAndDeploy(name: string, wasm: string, initialDeposit?: BN): Promise<ContractAccount>;
    getRoot(): Account;
    getAccount(name: string): Account;
    getContractAccount(name: string): ContractAccount;
}
declare type Args = {
    [key: string]: any;
};
export declare class Account {
    najAccount: nearAPI.Account;
    constructor(account: nearAPI.Account);
    call<T>(contractId: string, methodName: string, args?: Args, gas?: BN, attachedDeposit?: BN): Promise<T>;
}
export declare class ContractAccount extends Account {
    view<T>(method: string, args?: Args): Promise<T>;
}
export declare type TestRunnerFn = (s: SandboxRuntime) => Promise<void>;
export declare type SandboxRunner = (f: TestRunnerFn) => Promise<void>;
export declare function createSandbox(setupFn: TestRunnerFn): Promise<SandboxRunner>;
export {};
