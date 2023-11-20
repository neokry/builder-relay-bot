import { Hash, decodeFunctionData, isAddressEqual, parseAbiItem } from "viem";
import { CHAIN_ID } from "../../../constants/chains";
import { getPublicClient } from "../clients/getPublicClient";
import {
  L2_CROSS_DOMAIN_MESSENGER,
  L2_MIGRATION_DEPLOYER,
} from "../../../constants/addresses";
import { l2CrossDomainMessengerAbi } from "../abis/L2CrossDomainMessenger";
import { RelayMessageArgs } from "../actions/processDepositTx";

export const watchL2FailedRelay = ({
  icon,
  chainId,
  handleHashesRecieved,
}: {
  icon: string;
  chainId: CHAIN_ID;
  handleHashesRecieved: (hashes: Hash[]) => void;
}) => {
  console.log(
    `${icon} Watching failed relay events for address: ${L2_CROSS_DOMAIN_MESSENGER} on chain: ${chainId}`
  );
  const client = getPublicClient(chainId);

  const validateTransaction = async (transactionHash: Hash) => {
    const tx = await client.getTransaction({ hash: transactionHash });

    console.log(`${icon} Validating tx: ${transactionHash}`);

    const data = decodeFunctionData({
      abi: l2CrossDomainMessengerAbi,
      data: tx.input,
    });

    const [, , target] = data.args as RelayMessageArgs;
    if (data.functionName !== "relayMessage") {
      console.warn(
        `${icon} Invalid function name ${data.functionName} for tx: ${transactionHash}`
      );
      return false;
    }
    if (!isAddressEqual(target, L2_MIGRATION_DEPLOYER)) {
      console.warn(
        `${icon} Invalid target ${target} for tx: ${transactionHash}`
      );
      return false;
    }

    console.log(`${icon} Passed validation for tx: ${transactionHash}`);

    return true;
  };

  return client.watchEvent({
    address: L2_CROSS_DOMAIN_MESSENGER,
    event: parseAbiItem("event FailedRelayedMessage(bytes32 indexed msgHash)"),
    onLogs: async (events) => {
      try {
        console.log(`${icon} Found ${events.length} failed relay event(s)`);
        const allHashes = events.map((x) => x.transactionHash);
        const isValid = await Promise.all(
          allHashes.map((x) => validateTransaction(x))
        );
        const hashes = allHashes.filter((_, i) => isValid[i]);
        if (hashes.length > 0) handleHashesRecieved(hashes);
      } catch (err) {
        console.error(`${icon} Failed to validate transactions`, err);
      }
    },
  });
};
