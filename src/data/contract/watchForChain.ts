import { WatchEventReturnType } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { watchL1Deposit } from "./watchL1Deposit";
import { L1CrossDomainMessenger } from "../../constants/addresses";
import { processL2Tx } from "./processL2Tx";
import { ICON_FOR_CHAIN } from "../../constants/icon";

export const watchForChain = async ({
  l1ChainId,
  l2ChainId,
}: {
  l1ChainId: CHAIN_ID;
  l2ChainId: CHAIN_ID;
}) => {
  return await new Promise((_, rej) => {
    const icon = ICON_FOR_CHAIN[l2ChainId];

    console.log(`${icon} Starting relay for chain: ${l2ChainId}`);
    let unsubscribe: WatchEventReturnType | undefined;
    try {
      unsubscribe = watchL1Deposit({
        icon,
        chainId: l1ChainId,
        l1CrossDomainMessenger: L1CrossDomainMessenger[l2ChainId],
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
