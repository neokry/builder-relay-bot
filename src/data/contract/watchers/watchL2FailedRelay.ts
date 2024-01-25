import {
  Hash,
  Transaction,
  decodeFunctionData,
  isAddressEqual,
  parseAbiItem,
} from "viem";
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

  const validateTransaction = async (tx: Transaction) => {
    console.log(`${icon} Validating tx: ${tx.hash}`);

    const data = decodeFunctionData({
      abi: l2CrossDomainMessengerAbi,
      data: tx.input,
    });

    const [, , target] = data.args as RelayMessageArgs;
    if (data.functionName !== "relayMessage") {
      console.warn(
        `${icon} Invalid function name ${data.functionName} for tx: ${tx.hash}`
      );
      return false;
    }
    if (!isAddressEqual(target, L2_MIGRATION_DEPLOYER[chainId])) {
      console.warn(`${icon} Invalid target ${target} for tx: ${tx.hash}`);
      return false;
    }

    console.log(`${icon} Passed validation for tx: ${tx.hash}`);

    return true;
  };

  return client.watchEvent({
    address: L2_CROSS_DOMAIN_MESSENGER,
    event: parseAbiItem("event FailedRelayedMessage(bytes32 indexed msgHash)"),
    onLogs: async (events) => {
      try {
        console.log(`${icon} Found ${events.length} failed relay event(s)`);
        const allHashes = events.map((x) => x.transactionHash);
        const allTxs = await Promise.all(
          allHashes.map((x) => client.getTransaction({ hash: x }))
        );

        const isValid = await Promise.all(
          allTxs.map((x) => validateTransaction(x))
        );
        const validTxs = allTxs.filter((_, i) => isValid[i]);

        if (validTxs.length > 0) {
          // Order transactions by nonce (these will all be system transactions so nonce will be unique)
          // We want to preserve the order these are sent to the MessageRelayer
          const validHashes = validTxs
            .sort((a, b) => a.nonce - b.nonce)
            .map((x) => x.hash);

          handleHashesRecieved(validHashes);
        }
      } catch (err) {
        console.error(`${icon} Failed to validate transactions`, err);
      }
    },
  });
};
