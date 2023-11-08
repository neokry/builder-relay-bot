import { PublicClient, createPublicClient, http } from "viem";
import { ALL_CHAINS, CHAIN_ID } from "../../constants/chains";

const map = new Map<CHAIN_ID, PublicClient>();

export const getPublicClient = (chainId: CHAIN_ID) => {
  if (map.has(chainId)) return map.get(chainId)!;

  const client = createPublicClient({
    chain: ALL_CHAINS.find((x) => x.id === chainId),
    transport: http(),
  });

  if (!client) throw new Error("No viem client found");

  map.set(chainId, client);
  return client;
};
