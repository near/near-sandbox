import test from "ava";
import { join, resolve } from "path";
import { Binary } from "../src";
import * as fs from "fs/promises";
import { fileExists } from "../src/utils";

const name = "near-sandbox";
const LOCAL_PATH = join(__dirname, "..", "bin");
const LOCAL_BIN_PATH = join(LOCAL_PATH, name);
const fakeUrl = "https://example.com";
const realUrl =
  "https://ipfs.io/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG/Darwin-near-sandbox.tar.gz";

async function rm(path: string): Promise<void> {
  try {
    await fs.rm(path);
  } catch (e) {}
}

test.before(async (t) => {
  await rm(LOCAL_BIN_PATH)
  t.false(await fileExists(LOCAL_BIN_PATH));
});

test("can create", async (t) => {
  const bin = await Binary.create(name, fakeUrl);
  t.is(bin.name, name);
  t.deepEqual(bin.url, new URL(fakeUrl));
  t.is(bin.installDir, LOCAL_PATH);
  t.is(bin.installDir, Binary.DEFAULT_INSTALL_DIR);
  t.false(await bin.exists());
});

test("throws if url is bad", async (t) => {
  const bin = await Binary.create(name, fakeUrl);
  try {
    await bin.install();
    t.true(false, "Failed to throw");
  } catch(_) {
    t.true(true);
  }
})

test("can download file", async (t) => {
  const bin = await Binary.create(name, realUrl);
  t.is(bin.name, name);
  t.deepEqual(bin.url, new URL(realUrl));
  t.is(bin.installDir, LOCAL_PATH);
  t.is(bin.installDir, Binary.DEFAULT_INSTALL_DIR);
  t.false(await bin.exists());
  t.true(await bin.install());
  t.true(await bin.exists());
});

test("can download file to destination", async (t) => {
  const p = join(__dirname, "..", 'test_destination');
  const bin = await Binary.create(name, realUrl, p);
  await rm(join(p, name));
  t.is(bin.name, name);
  t.deepEqual(bin.url, new URL(realUrl));
  t.not(bin.installDir, LOCAL_PATH);
  t.not(bin.installDir, Binary.DEFAULT_INSTALL_DIR);
  t.false(await bin.exists());
  t.true(await bin.install());
  t.true(await bin.exists());
});

test("can use local file", async (t) => {
  const localPath = resolve(join(__dirname, "..", "test_files"));
  const bin = await Binary.create(name, realUrl, localPath);
  t.is(bin.installDir, localPath);
  t.true(await bin.exists());
});

test("can run", async (t) => {
  const bin = await Binary.create(name, realUrl);
  const res = await bin.run(["--help"], { stdio: [null, null, null] });
  t.is(res, 0);
});

