import { config } from "dotenv";
import { CHAIN_ID } from "./constants/chains";
import { watchChain } from "./actions/watchChain";

if (process.env.NODE_ENV !== "production") config();

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
