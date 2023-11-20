import { WatchEventReturnType } from "viem";
import { CHAIN_ID } from "../constants/chains";
import { processDepositTx } from "../data/contract/actions/processDepositTx";
import { ICON_FOR_CHAIN } from "../constants/icon";
import { watchL2FailedRelay } from "../data/contract/watchers/watchL2FailedRelay";
import { watchL2MigrationFinalizations } from "../data/contract/watchers/watchL2MigrationFinalizations";
import { airdropForDAO } from "../data/contract/actions/airdropForDAO";

export const watchChain = async ({ chainId }: { chainId: CHAIN_ID }) => {
  return await new Promise((_, rej) => {
    const icon = ICON_FOR_CHAIN[chainId];

    console.log(`${icon} Starting relay for chain: ${chainId}`);
    let unsubscribe: WatchEventReturnType[] = [];

    try {
      unsubscribe.push(
        watchL2MigrationFinalizations({
          icon,
          chainId: chainId,
          handleDAODeployed: (token) => airdropForDAO({ token, chainId }),
        })
      );

      unsubscribe.push(
        watchL2FailedRelay({
          icon,
          chainId: chainId,
          handleHashesRecieved: (hashes) =>
            Promise.allSettled(
              hashes.map((x) => processDepositTx({ hash: x, chainId: chainId }))
            ),
        })
      );
    } catch (err) {
      unsubscribe.map((x) => x());
      rej(err);
    }
  });
};
