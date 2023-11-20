import { WalletClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ALL_CHAINS, CHAIN_ID } from "../../../constants/chains";

const map = new Map<CHAIN_ID, WalletClient>();

export const getWalletClient = (chainId: CHAIN_ID) => {
  if (map.has(chainId)) return map.get(chainId)!;

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: ALL_CHAINS.find((x) => x.id === chainId),
    transport: http(),
  });

  if (!client) throw new Error("No viem client found");

  map.set(chainId, client);
  return client;
};
