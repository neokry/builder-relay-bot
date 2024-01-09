import { WatchEventReturnType } from "viem";
import { CHAIN_ID } from "../constants/chains";
import { processDepositTx } from "../data/contract/actions/processDepositTx";
import { ICON_FOR_CHAIN } from "../constants/icon";
import { watchL2MigrationFinalizations } from "../data/contract/watchers/watchL2MigrationFinalizations";
import { airdropForDAO } from "../data/contract/actions/airdropForDAO";
import { watchL1Deposit } from "../data/contract/watchers/watchL1Deposit";
import { setMetadataAttributesForDAO } from "../data/contract/actions/setMetadataAttributesForDAO";

export const watchChain = async ({ chainId }: { chainId: CHAIN_ID }) => {
  return await new Promise(async (_, rej) => {
    const icon = ICON_FOR_CHAIN[chainId];

    console.log(`${icon} Starting relay for chain: ${chainId}`);
    let unsubscribe: WatchEventReturnType[] = [];

    try {
      unsubscribe.push(
        watchL2MigrationFinalizations({
          icon,
          chainId: chainId,
          handleDAODeployed: async (token) => {
            await setMetadataAttributesForDAO({ token, chainId });
            await airdropForDAO({ token, chainId });
          },
        })
      );

      unsubscribe.push(
        watchL1Deposit({
          icon,
          chainId: chainId,
          handleL2HashesRecieved: async (hashes) => {
            // Process hashes sequentially
            for (const hash of hashes) {
              await processDepositTx({ hash, chainId: chainId });
            }
          },
        })
      );
    } catch (err) {
      unsubscribe.map((x) => x());
      rej(err);
    }
  });
};
