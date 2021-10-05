import test from "ava";
import { join } from "path";
import { Binary } from "../src";

const TEST_FILES_PATH = join(__dirname, "..", "test_files");
process.env['NEAR_SANDBOX_BINARY_PATH'] = TEST_FILES_PATH;

const name = "near-sandbox";
const fakeUrl = "https://example.com";

test("can use local file", async (t) => {
  const bin = await Binary.create(name, fakeUrl);
  t.is(bin.installDir, TEST_FILES_PATH);
  t.assert(await bin.exists());
});
