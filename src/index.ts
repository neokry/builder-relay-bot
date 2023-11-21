import { config } from "dotenv";
if (process.env.NODE_ENV !== "production") config();

import { CHAIN_ID } from "./constants/chains";
import { watchChain } from "./actions/watchChain";

const run = async () => {
  try {
    await watchChain({
      chainId: CHAIN_ID.BASE_GOERLI,
    });
  } catch (err) {
    console.error("❌ Critical error", err);
  } finally {
    console.log("🫡 Ending relay");
  }
};

run();
