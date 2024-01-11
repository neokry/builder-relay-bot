import {
  Hash,
  TransactionReceipt,
  decodeEventLog,
  decodeFunctionData,
  formatEther,
  isAddressEqual,
} from "viem";
import { CHAIN_ID } from "../../../constants/chains";
import { getPublicClient } from "../clients/getPublicClient";
import { getWalletClient } from "../clients/getWalletClient";
import { l2CrossDomainMessengerAbi } from "../abis/L2CrossDomainMessenger";
import { l2MigrationDeployerAbi } from "../abis/L2MigrationDeployerAbi";
import {
  L2_CROSS_DOMAIN_MESSENGER,
  L2_MIGRATION_DEPLOYER,
} from "../../../constants/addresses";
import { ICON_FOR_CHAIN } from "../../../constants/icon";

export type RelayMessageArgs = [
  bigint,
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  `0x${string}`
];

export const processDepositTx = async ({
  hash,
  chainId,
}: {
  hash: Hash;
  chainId: CHAIN_ID;
}) => {
  const icon = ICON_FOR_CHAIN[chainId];

  try {
    const publicClient = getPublicClient(chainId);

    const tx = await publicClient.getTransaction({ hash });
    if (!tx.to) throw new Error("Invalid transaction to relay");

    const txReceipt = await publicClient.waitForTransactionReceipt({ hash });

    // Transaction was already successful no need to relay
    if (txReceipt.status == "success") {
      console.log(
        `${icon} Transaction: ${hash} was already successfully executed`
      );
      return;
    }

    const walletClient = getWalletClient(chainId);
    if (!walletClient.account) throw new Error("No account found");

    const balance = await publicClient.getBalance({
      address: walletClient.account.address,
    });

    console.log(
      `${icon} Processing with wallet: ${
        walletClient.account.address
      } and balance: ${formatEther(balance)} ETH to process tx: ${hash}`
    );

    const { args: xDomainArgs } = decodeFunctionData({
      abi: l2CrossDomainMessengerAbi,
      data: tx.input,
    });

    if (!xDomainArgs) throw new Error("Invalid calldata");

    const [, sender, target, , , message] = xDomainArgs as RelayMessageArgs;

    // We need to alias the address to simulate properly
    const senderAliased = await publicClient.readContract({
      abi: l2MigrationDeployerAbi,
      address: L2_MIGRATION_DEPLOYER,
      functionName: "applyL1ToL2Alias",
      args: [sender],
    });

    if (!isAddressEqual(target, L2_MIGRATION_DEPLOYER))
      throw new Error("Invalid target");

    const { args: l2MigrationArgs, functionName } = decodeFunctionData({
      abi: l2MigrationDeployerAbi,
      data: message,
    });

    console.log(`${icon} Simulating contract calls for tx: ${hash}`);

    const [migration, relay] = await Promise.all([
      publicClient.simulateContract({
        account: senderAliased,
        abi: l2MigrationDeployerAbi,
        address: L2_MIGRATION_DEPLOYER,
        functionName: functionName as any,
        args: l2MigrationArgs,
      }),
      publicClient.simulateContract({
        account: walletClient.account,
        abi: l2CrossDomainMessengerAbi,
        address: L2_CROSS_DOMAIN_MESSENGER,
        functionName: "relayMessage",
        args: xDomainArgs as RelayMessageArgs,
      }),
    ]);

    const gasMigrate = await publicClient.estimateContractGas(
      migration.request
    );

    const base = 80000n;
    const bufferRatio = 10n;
    const buffer = gasMigrate / bufferRatio;

    const gasToUse = base + gasMigrate + buffer;

    console.log(
      `${icon} Transaction ${hash} is valid, initiating relay with gas: `,
      gasToUse
    );

    const newHash = await walletClient.writeContract({
      ...relay.request,
      gas: gasToUse,
    });

    const newTxReceipt = await publicClient.waitForTransactionReceipt({
      hash: newHash,
    });

    if (!isRelaySuccessful(newTxReceipt))
      throw new Error(`Relayed failed, tx: ${newHash}`);

    console.log(
      `${icon} Transaction relayed ogTx: ${hash} relayedTx: ${newHash}`
    );
  } catch (err) {
    console.error(`${icon} Failed to process tx: ${hash} with error: ${err}`);
  }
};

const isRelaySuccessful = (txReciept: TransactionReceipt) => {
  return txReciept.logs.some((log) => {
    try {
      const event = decodeEventLog({
        abi: l2CrossDomainMessengerAbi,
        data: log.data,
        topics: log.topics,
      });
      if (event.eventName === "RelayedMessage") return true;
    } catch {}

    return false;
  });
};
