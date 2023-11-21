import { PublicClient, createPublicClient, http } from "viem";
import { ALL_CHAINS, CHAIN_ID } from "../../../constants/chains";

const map = new Map<CHAIN_ID, PublicClient>();

const getRpcUrl = (chainId: CHAIN_ID) => {
  switch (chainId) {
    case CHAIN_ID.GOERLI:
      return `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.BASE_GOERLI:
      return `https://base-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    default:
      throw new Error("No RPC URL found for chain");
  }
};

export const getPublicClient = (chainId: CHAIN_ID) => {
  if (map.has(chainId)) return map.get(chainId)!;

  const client = createPublicClient({
    chain: ALL_CHAINS.find((x) => x.id === chainId),
    transport: http(getRpcUrl(chainId)),
  });

  if (!client) throw new Error("No viem client found");

  map.set(chainId, client);
  return client;
};
