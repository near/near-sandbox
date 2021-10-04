import { Binary } from ".";
import { getBinary } from "./getBinary";

getBinary().then(async (bin) => {
  if (await bin.exists()) {
    if (bin.installDir === Binary.DEFAULT_INSTALL_DIR)
  }
});
