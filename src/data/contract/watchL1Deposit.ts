import { Address, Hash, parseAbiItem } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { getPublicClient } from "./getPublicClient";
import { L2DeployHelper } from "../../constants/addresses";
import { publicL1OpStackActions } from "op-viem";

export const watchL1Deposit = ({
  chainId,
  optimismPortal,
  handleL2HashesRecieved,
}: {
  chainId: CHAIN_ID;
  optimismPortal: Address;
  handleL2HashesRecieved: (hashes: Hash[]) => void;
}) => {
  console.log(
    `💭 Watching events for address: ${optimismPortal} on chain: ${chainId}`
  );
  const client = getPublicClient(chainId).extend(publicL1OpStackActions);

  const getL2Hashes = async (transactionHash: Hash) => {
    await client.waitForTransactionReceipt({ hash: transactionHash });
    const hashes = await client.getL2HashesForDepositTx({
      l1TxHash: transactionHash,
    });

    console.log("✅ Found hashes", hashes);

    return hashes;
  };

  return client.watchEvent({
    address: optimismPortal,
    event: parseAbiItem(
      "event TransactionDeposited(address indexed from, address indexed to, uint256 indexed version, bytes opaqueData)"
    ),
    args: {
      to: L2DeployHelper,
    },
    onLogs: async (e) => {
      try {
        console.log("✅ Found events", e);
        const hashes = await Promise.all(
          e.map((x) => getL2Hashes(x.transactionHash))
        );
        handleL2HashesRecieved(hashes.flat());
      } catch (err) {
        console.log("❌ Failed to get all hashes", err);
      }
    },
  });
};
