import { config } from "dotenv";
if (process.env.NODE_ENV !== "production") config();

import { CHAINS_TO_WATCH } from "./constants/chains";
import { watchChain } from "./actions/watchChain";

const run = async () => {
  try {
    await Promise.all(
      CHAINS_TO_WATCH.map((chainId) =>
        watchChain({
          chainId,
        })
      )
    );
  } catch (err) {
    console.error("❌ Critical error", err);
  } finally {
    console.log("🫡 Ending relay");
  }
};

run();
