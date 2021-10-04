import { getBinary } from "./getBinary";

async function run() {
  try {
    const bin = await getBinary();
    console.log("help")
    if (process.argv.length < 3) {
      process.argv.push("--help");
    }
    bin.runAndExit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
