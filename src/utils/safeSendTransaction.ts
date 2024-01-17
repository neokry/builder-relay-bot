import { CHAIN_ID } from "../constants/chains";
import { ICON_FOR_CHAIN } from "../constants/icon";
import { getPublicClient } from "../data/contract/clients/getPublicClient";
import { getWalletClient } from "../data/contract/clients/getWalletClient";
import { TransactionReceipt, formatEther } from "viem";

const maxFailures = 3;

export const safeSendTransaction = async ({
  request,
  gasBase,
  gasBufferRatio,
  gasEstimated,
  chainId,
}: {
  request: any;
  gasBase: bigint;
  gasBufferRatio: bigint;
  gasEstimated: bigint;
  chainId: CHAIN_ID;
}) => {
  const icon = ICON_FOR_CHAIN[chainId];

  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClient(chainId);

  if (!walletClient.account) throw new Error("No account found");

  const balance = await publicClient.getBalance({
    address: walletClient.account.address,
  });

  let nonce = await publicClient.getTransactionCount({
    address: walletClient.account.address,
  });

  const gas = gasBase + gasEstimated + gasEstimated / gasBufferRatio;

  console.log(
    `${icon} Sending tx with wallet: ${
      walletClient.account.address
    } and balance: ${formatEther(balance)} ETH`
  );

  let failureCount = 0;
  let res: TransactionReceipt | undefined;

  while (failureCount < maxFailures) {
    try {
      const hash = await walletClient.writeContract({
        ...request,
        gas,
        nonce,
      });

      res = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 2,
      });

      break;
    } catch (err) {
      const errorMessage = (err as Error).message;

      if (
        errorMessage.includes("transaction underpriced") ||
        errorMessage.includes("increasing the nonce")
      ) {
        nonce++;
      }

      failureCount++;
      console.log(
        `${icon} Failed to send tx retrying: ${failureCount} of ${maxFailures}`
      );

      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  if (!res) throw new Error("Consistently failed to send transaction");

  return res;
};
