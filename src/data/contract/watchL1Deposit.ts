import { Address, Hash, parseAbiItem } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { getPublicClient } from "./getPublicClient";
import { L2_MIGRATION_DEPLOYER } from "../../constants/addresses";
import { publicL1OpStackActions } from "op-viem";

export const watchL1Deposit = ({
  icon,
  chainId,
  l1CrossDomainMessenger,
  handleL2HashesRecieved,
}: {
  icon: string;
  chainId: CHAIN_ID;
  l1CrossDomainMessenger: Address;
  handleL2HashesRecieved: (hashes: Hash[]) => void;
}) => {
  console.log(
    `${icon} Watching deposit events for address: ${l1CrossDomainMessenger} on chain: ${chainId}`
  );
  const client = getPublicClient(chainId).extend(publicL1OpStackActions);

  const getL2Hashes = async (transactionHash: Hash) => {
    console.log(`${icon} Found deposit tx: ${transactionHash}`);
    await client.waitForTransactionReceipt({ hash: transactionHash });
    const hashes = await client.getL2HashesForDepositTx({
      l1TxHash: transactionHash,
    });

    console.log(`${icon} Found L2 hashes: ${hashes}`);

    return hashes;
  };

  return client.watchEvent({
    address: l1CrossDomainMessenger,
    event: parseAbiItem(
      "event SentMessage(address indexed target, address sender, bytes message, uint256 messageNonce, uint256 gasLimit)"
    ),
    args: {
      target: L2_MIGRATION_DEPLOYER,
    },
    onLogs: async (e) => {
      try {
        console.log(`${icon} Found events`);
        const hashes = await Promise.all(
          e.map((x) => getL2Hashes(x.transactionHash))
        );

        if (hashes.length === 0) return;
        handleL2HashesRecieved(hashes.flat());
      } catch (err) {
        console.error(`${icon} Failed to get all hashes`, err);
      }
    },
  });
};
