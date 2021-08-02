import BN from "bn.js";
import * as nearAPI from "near-api-js";
interface FunctionCallOptions {
    /** The NEAR account id where the contract is deployed */
    contractId: string;
    /** The name of the method to invoke */
    methodName: string;
    /**
     * named arguments to pass the method `{ messageText: 'my message' }`
     */
    args: object;
    /** max amount of gas that method call can use */
    gas?: BN;
    /** amount of NEAR (in yoctoNEAR) to send together with the call */
    attachedDeposit?: BN;
    /**
     * Metadata to send the NEAR Wallet if using it to sign transactions.
     * @see {@link RequestSignTransactionsOptions}
     */
    walletMeta?: string;
    /**
     * Callback url to send the NEAR Wallet if using it to sign transactions.
     * @see {@link RequestSignTransactionsOptions}
     */
    walletCallbackUrl?: string;
}
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
    call_raw(args: FunctionCallOptions): Promise<nearAPI.providers.FinalExecutionOutcome>;
    /**
     * Convenient wrapper around lower-level {{call_raw}}.
     *
     * @param args arguments required for call
     * @returns any parsed return value, or throws with an error if call failed
     */
    call(args: FunctionCallOptions): Promise<any>;
}
export declare class ContractAccount extends Account {
    view_raw(method: string, args?: Args): Promise<any>;
    view(method: string, args?: Args): Promise<string | null>;
}
export declare type TestRunnerFn = (s: SandboxRuntime) => Promise<void>;
export declare type SandboxRunner = (f: TestRunnerFn) => Promise<void>;
export declare function createSandbox(setupFn: TestRunnerFn): Promise<SandboxRunner>;
export {};
