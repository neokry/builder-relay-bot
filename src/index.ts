import { CHAIN_ID } from "./constants/chains";
import { watchForChain } from "./data/contract/watchForChain";

try {
  await watchForChain({
    chainId: CHAIN_ID.BASE_GOERLI,
  });
} catch (err) {
  console.error("❌ Critical error", err);
} finally {
  console.log("🫡 Ending relay");
}
