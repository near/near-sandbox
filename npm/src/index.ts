import * as fs from "fs/promises";
import { join } from "path";
import * as tar from "tar";
import got from "got";
import { fileExists, inherit, searchPath } from "./utils";
import { spawn } from "child_process";
import * as stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

export class Binary {
  url!: URL;
  static readonly DEFAULT_INSTALL_DIR = join(__dirname, "..", "bin");

  protected constructor(
    public name: string,
    path: URL | string,
    public installDir: string = Binary.DEFAULT_INSTALL_DIR
  ) {
    let errors = [];
    if (!name || typeof name !== "string") {
      errors.push("You must specify the name of your binary as a string");
    }
    try {
      this.url = new URL(path);
    } catch (e) {
      errors.push(e);
    }

    if (errors.length > 0) {
      errors.push(
        '\nCorrect usage: new Binary("my-binary", "https://example.com/binary/download.tar.gz"'
      );
      errors.unshift(
        "One or more of the parameters you passed to the Binary constructor are invalid:\n"
      );
      throw new Error(errors.join("\n"));
    }
  }

  /**
   *
   * @param name binary name, e.g. 'git'
   * @param path URL of where to find binary
   * @param destination Directory to put the binary
   * @returns
   */
  static async create(
    name: string,
    path: string | URL,
    destination?: string
  ): Promise<Binary> {
    const bin = new Binary(name, path, destination ?? (await searchPath(name)));
    if (destination === bin.installDir) {
      await fs.mkdir(bin.installDir, { recursive: true });
    }
    return bin;
  }

  get binPath(): string {
    return join(this.installDir, this.name);
  }

  download(): Promise<void> {
    return pipeline(
      got.stream(this.url),
      new stream.PassThrough(),
      tar.x({ strip: 1, C: this.installDir }),
    );
  }

  async install(): Promise<boolean> {
    try {
      await this.download();
    } catch (error: unknown) {
      throw new Error(`Failed to download binary ${this.url.toString()}`);
    }
    return true;
  }

  async exists(): Promise<boolean> {
    return await fileExists(this.binPath);
  }

  async run(
    cliArgs?: string[],
    options = { stdio: [null, inherit, inherit] }
  ): Promise<number> {
    if (!(await this.exists())) {
      try { 
        await this.install();
      } catch (err) {
        console.error(err);
        return 1;
      }
    }

    const args = cliArgs ?? process.argv.slice(2);
    const result = spawn(this.binPath, args, options);
    result.on("error", (error) => {
      console.log(error);
    });

    return new Promise((resolve, reject) => {
      result.on("close", (code) => {
        if (!code) {
          resolve(code ?? 0);
        }
        reject(code);
      });
    });
  }

  async runAndExit(
    cliArgs?: string[],
    options = { stdio: [null, inherit, inherit] }
  ): Promise<void> {
    process.exit(await this.run(cliArgs, options));
  }
}
