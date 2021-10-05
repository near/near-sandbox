import { Binary } from ".";
import { join } from "path";
import * as os from "os";

function getPlatform() {
  const type = os.type();
  const arch = os.arch();

  if (type === "Linux" && arch === "x64") return "Linux";
  if (type === "Darwin" && arch === "x64") return "Darwin";

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

export function getBinary(name: string = "near-sandbox"): Promise<Binary> {
  if (!process.env["NEAR_SANDBOX_BIN_PATH"]) {
    process.env["NEAR_SANDBOX_BINARY_PATH"] = join(
      os.homedir(),
      ".near",
      "sandbox"
    );
  }

  const platform = getPlatform();
  // Will use version after publishing to AWS
  // const version = require("./package.json").version;
  const fromEnv = process.env["SANDBOX_ARTIFACT_URL"];
  const urls = [
    "https://ipfs.io/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG",
    "https://cloudflare-ipfs.com/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG",
  ].map((baseUrl) => `${baseUrl}/${platform}-${name}.tar.gz`);

  if (fromEnv) {
    urls.unshift(fromEnv);
  }

  return Binary.create(name, urls);
}
