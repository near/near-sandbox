import { strict as assert } from "assert";
import { createSandbox, SandboxRuntime, SandboxRunner } from "near-sandbox-runner";

jest.setTimeout(15000)

// sandbox creates sub-accounts of 'test.near'
const ALI = "ali.test.near";
const BOB = "bob.test.near";
const CONTRACT = "status-message.test.near";

let sandboxRunner: SandboxRunner

beforeAll(async () => {
  sandboxRunner = await createSandbox(async (sandbox: SandboxRuntime) => {
    await sandbox.createAndDeploy(
      CONTRACT,
      `${__dirname}/../build/debug/status_message.wasm`
    );
    await sandbox.createAccount(ALI);
    await sandbox.createAccount(BOB);
  })
})

test('Ali sets then gets status', async () => {
  await sandboxRunner(async (sandbox: SandboxRuntime) => {
    const ali = sandbox.getAccount(ALI);
    const contract = sandbox.getContractAccount(CONTRACT);
    await ali.call(CONTRACT, "set_status", { message: "hello" })
    const result = await contract.view("get_status", { account_id: ALI })
    assert.equal(result, "hello");
  })
});

test('Bob gets null status', async () => {
  await sandboxRunner(async (sandbox: SandboxRuntime) => {
    const contract = sandbox.getContractAccount(CONTRACT);
    const result = await contract.view("get_status", { account_id: BOB })
    assert.equal(result, null)
  })
});

test('Bob and Ali have different statuses', async () => {
  await sandboxRunner(async (sandbox: SandboxRuntime) => {
    const bob = sandbox.getAccount(BOB);
    const contract = sandbox.getContractAccount(CONTRACT);
    await bob.call(CONTRACT, "set_status", { message: "world" })
    const bobStatus = await contract.view(
      "get_status",
      { account_id: BOB }
    )
    assert.equal(bobStatus, "world");

    const aliStatus = await contract.view(
      "get_status",
      { account_id: ALI }
    )
    assert.equal(aliStatus, null)
  })
});
