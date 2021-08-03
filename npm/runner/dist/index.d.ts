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
    get connection(): nearAPI.Connection;
    get accountId(): string;
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    call_raw(contractId: string, methodName: string, args: object, gas?: string | BN, attachedDeposit?: string | BN): Promise<any>;
    /**
     * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns any parsed return value, or throws with an error if call failed
     */
    call(contractId: string, methodName: string, args: object, gas?: string | BN, // TODO: import DEFAULT_FUNCTION_CALL_GAS from NAJ
    attachedDeposit?: string | BN): Promise<any>;
}
export declare class ContractAccount extends Account {
    view_raw(method: string, args?: Args): Promise<any>;
    view(method: string, args?: Args): Promise<any>;
}
export declare type TestRunnerFn = (s: SandboxRuntime) => Promise<void>;
export declare type SandboxRunner = (f: TestRunnerFn) => Promise<void>;
export declare function createSandbox(setupFn: TestRunnerFn): Promise<SandboxRunner>;
export {};
