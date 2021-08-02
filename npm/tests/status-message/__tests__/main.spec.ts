const assert = require("assert").strict;
const { createSandbox } = require("near-sandbox-runner")

// sandbox creates sub-accounts of 'test.near'
const ALICE = "alice.test.near";
const BOB = "bob.test.near";
const CONTRACT = "status-message.test.near";

// 1. Creates testing accounts and deploys a contract
async function initSandbox() {
  return await createSandbox(async sandbox => {
    await sandbox.createAndDeploy(
      CONTRACT,
      `${__dirname}/../build/debug/status_message.wasm`
    );
    await sandbox.createAccount(ALICE);
    await sandbox.createAccount(BOB);
  })
}

// 2. Performs a `set_status` transaction signed by Alice and then calls `get_status` to confirm `set_status` worked
async function testAliceSetsStatus(sandboxRunner) {
  await sandboxRunner(async sandbox => {
    const alice = sandbox.getAccount(ALICE);
    const contract = sandbox.getContractAccount(CONTRACT);
    await alice.call(CONTRACT, "set_status", { message: "hello" })
    const result = await contract.view("get_status", { account_id: ALICE })
    assert.equal(result, "hello");
  })
}

// 3. Gets Bob's status and which should be `null` as Bob has not yet set status
async function testDefaultStatus(sandboxRunner) {
  await sandboxRunner(async sandbox => {
    const contract = sandbox.getContractAccount(CONTRACT);
    const result = await contract.view("get_status", { account_id: BOB })
    assert.equal(result, null)
  })
}

// 4. Performs a `set_status` transaction signed by Bob and then calls `get_status` to show Bob's changed status and should not affect Alice's status
async function testStatusPerAccount(sandboxRunner) {
  await sandboxRunner(async sandbox => {
    const bob = sandbox.getAccount(BOB);
    const contract = sandbox.getContractAccount(CONTRACT);
    await bob.call(CONTRACT, "set_status", { message: "world" })
    const bobStatus = await contract.view(
      "get_status",
      { account_id: BOB }
    )
    assert.equal(bobStatus, "world");

    const aliceStatus = await contract.view(
      "get_status",
      { account_id: ALICE }
    )
    assert.equal(aliceStatus, null)
  })
}

jest.setTimeout(15000)

it('works', async () => {
  const sandboxRunner = await initSandbox()
  await Promise.all([
    testAliceSetsStatus(sandboxRunner),
    testDefaultStatus(sandboxRunner),
    testStatusPerAccount(sandboxRunner),
  ])
  console.log('\x1b[32mPASSED\x1b[0m')
})
