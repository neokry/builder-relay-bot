import { config } from "dotenv";
import { CHAIN_ID } from "./constants/chains";
import { watchForChain } from "./data/contract/watchForChain";

if (process.env.NODE_ENV !== "production") config();

console.log(process.env.PRIVATE_KEY);

const run = async () => {
  try {
    await watchForChain({
      chainId: CHAIN_ID.BASE_GOERLI,
    });
  } catch (err) {
    console.error("❌ Critical error", err);
  } finally {
    console.log("🫡 Ending relay");
  }
};

run();
