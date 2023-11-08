import { WatchEventReturnType } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { watchL1Deposit } from "./watchL1Deposit";
import { L1OptimismPortal } from "../../constants/addresses";
import { processL2Tx } from "./processL2Tx";

export const watchForChain = async ({
  l1ChainId,
  l2ChainId,
}: {
  l1ChainId: CHAIN_ID;
  l2ChainId: CHAIN_ID;
}) => {
  return await new Promise((_, rej) => {
    console.log(`🚀 Starting relay for chain: ${l2ChainId}`);
    let unsubscribe: WatchEventReturnType | undefined;
    try {
      unsubscribe = watchL1Deposit({
        chainId: l1ChainId,
        optimismPortal: L1OptimismPortal[l2ChainId],
        handleL2HashesRecieved: (hashes) =>
          Promise.allSettled(
            hashes.map((x) => processL2Tx({ hash: x, chainId: l2ChainId }))
          ),
      });
    } catch (err) {
      unsubscribe?.();
      rej(err);
    }
  });
};
