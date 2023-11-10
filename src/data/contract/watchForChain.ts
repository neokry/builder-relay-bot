import { WatchEventReturnType } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { processL2Tx } from "./processL2Tx";
import { ICON_FOR_CHAIN } from "../../constants/icon";
import { watchL2FailedRelay } from "./watchL2FailedRelay";

export const watchForChain = async ({ chainId }: { chainId: CHAIN_ID }) => {
  return await new Promise((_, rej) => {
    const icon = ICON_FOR_CHAIN[chainId];

    console.log(`${icon} Starting relay for chain: ${chainId}`);
    let unsubscribe: WatchEventReturnType | undefined;
    try {
      unsubscribe = watchL2FailedRelay({
        icon,
        chainId: chainId,
        handleHashesRecieved: (hashes) =>
          Promise.allSettled(
            hashes.map((x) => processL2Tx({ hash: x, chainId: chainId }))
          ),
      });
    } catch (err) {
      unsubscribe?.();
      rej(err);
    }
  });
};
