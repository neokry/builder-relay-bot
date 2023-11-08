import { Hash } from "viem";
import { CHAIN_ID } from "../../constants/chains";
import { getPublicClient } from "./getPublicClient";
import { getWalletClient } from "./getWalletClient";

export const processL2Tx = async ({
  hash,
  chainId,
}: {
  hash: Hash;
  chainId: CHAIN_ID;
}) => {
  try {
    // wait 5 minutes to let the sequencer process the tx
    Bun.sleep(5 * 60_000);
    const publicClient = getPublicClient(chainId);

    const txReciept = await publicClient.waitForTransactionReceipt({ hash });

    if (txReciept.status === "success") {
      console.log("✅ Transaction already relayed");
      return;
    }

    console.log("🚀 Relaying transaction");

    const tx = await publicClient.getTransaction({ hash });
    if (!tx.to) throw new Error("Invalid transaction to relay");

    const walletClient = getWalletClient(chainId);
    if (!walletClient.account) throw new Error("No account found");

    // Check if transaction will fail
    publicClient.call({
      account: walletClient.account,
      to: tx.to,
      data: tx.input,
    });

    // Valid transaction, send it
    const newHash = await walletClient.sendTransaction({
      chain: walletClient.chain,
      account: walletClient.account,
      to: tx.to,
      data: tx.input,
    });

    const newTxReceipt = await publicClient.waitForTransactionReceipt({
      hash: newHash,
    });

    if (newTxReceipt.status === "reverted")
      throw new Error("Failed to relay transaction");

    console.log("✅ Transaction relayed");
  } catch (err) {
    console.error("❌ Failed to process tx", err);
  }
};
