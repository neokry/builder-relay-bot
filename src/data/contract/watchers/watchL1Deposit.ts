import { Hash, parseAbiItem } from "viem";
import { CHAIN_ID, L1_CHAIN_ID } from "../../../constants/chains";
import { getPublicClient } from "../clients/getPublicClient";
import { L1_CROSS_DOMAIN_MESSENGER } from "../../../constants/addresses";
import { publicL1OpStackActions } from "op-viem";

export const watchL1Deposit = ({
  icon,
  chainId,
  handleL2HashesRecieved,
}: {
  icon: string;
  chainId: CHAIN_ID;
  handleL2HashesRecieved: (hashes: Hash[]) => void;
}) => {
  const l1CrossDomainMessenger = L1_CROSS_DOMAIN_MESSENGER[chainId];
  const l1ChainId = L1_CHAIN_ID;
  console.log(
    `${icon} Watching deposit events for address: ${l1CrossDomainMessenger} on chain: ${l1ChainId}`
  );

  const l1Client = getPublicClient(l1ChainId).extend(publicL1OpStackActions);
  const l2Client = getPublicClient(chainId).extend(publicL1OpStackActions);

  const getL2Hashes = async (transactionHash: Hash) => {
    console.log(`${icon} Found deposit tx: ${transactionHash}`);
    const hashes = await l1Client.getL2HashesForDepositTx({
      l1TxHash: transactionHash,
    });

    console.log(`${icon} Found L2 hashes: ${hashes}, waiting for inital relay`);

    const ONE_MINUTE = 60000;

    // Wait for ten minutes
    await new Promise<void>((res) => {
      setTimeout(() => res(), ONE_MINUTE * 10);
    });

    // Validate that the inital relay has started
    await l2Client.waitForTransactionReceipt({ hash: hashes[0] });

    const allTxs = await Promise.all(
      hashes.map((x) => l2Client.getTransaction({ hash: x }))
    );

    // Return hashes in the order they were relayed
    return allTxs.sort((a, b) => a.nonce - b.nonce).map((x) => x.hash);
  };

  return l1Client.watchEvent({
    address: l1CrossDomainMessenger,
    event: parseAbiItem(
      "event SentMessage(address indexed target, address sender, bytes message, uint256 messageNonce, uint256 gasLimit)"
    ),
    onLogs: async (e) => {
      try {
        const uniqueL1Hashes = Array.from(
          new Set(e.map((x) => x.transactionHash))
        );

        console.log(`${icon} Found ${uniqueL1Hashes.length} L1 hashes`);

        const l2Hashes = await Promise.all(
          uniqueL1Hashes.map((x) => getL2Hashes(x))
        );

        if (l2Hashes.length === 0) return;
        handleL2HashesRecieved(l2Hashes.flat());
      } catch (err) {
        console.error(`${icon} Failed to get all hashes`, err);
      }
    },
  });
};
