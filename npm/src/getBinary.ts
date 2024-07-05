import { Binary } from ".";
import { join } from "path";
import * as os from "os";

function getPlatform() {
  const type = os.type();
  const arch = os.arch();

  if ((type === "Linux" || type === "Darwin") && arch === "x64") {
    return [type, "x86_64"];
  } else if (type === "Darwin" && arch === "arm64") {
    return [type, "arm64"];
  }

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

export function AWSUrl(): string {
  const [platform, arch] = getPlatform();
  return `https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/${platform}-${arch}/1.40.0/7dd0b5993577f592be15eb102e5a3da37be66271/near-sandbox.tar.gz`;
}

export function getBinary(name: string = "near-sandbox"): Promise<Binary> {
  if (!process.env["NEAR_SANDBOX_BIN_PATH"]) {
    process.env["NEAR_SANDBOX_BINARY_PATH"] = join(
      os.homedir(),
      ".near",
      "sandbox"
    );
  }

  // Will use version after publishing to AWS
  // const version = require("./package.json").version;
  const fromEnv = process.env["SANDBOX_ARTIFACT_URL"];
  const urls = [AWSUrl()];
  if (fromEnv) {
    urls.unshift(fromEnv);
  }

  return Binary.create(name, urls);
}
