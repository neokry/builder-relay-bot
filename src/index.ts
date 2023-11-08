import { CHAIN_ID } from "./constants/chains";
import { watchForChain } from "./data/contract/watchForChain";

try {
  console.log("🚀 Starting relay");

  await watchForChain({
    l1ChainId: CHAIN_ID.GOERLI,
    l2ChainId: CHAIN_ID.BASE_GOERLI,
  });
} catch (err) {
  console.error("❌ Critical error", err);
} finally {
  console.log("🫡 Ending relay");
}
