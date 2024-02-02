import { PublicClient, createPublicClient, http } from "viem";
import { ALL_CHAINS, CHAIN_ID } from "../../../constants/chains";

const map = new Map<CHAIN_ID, PublicClient>();

const getRpcUrl = (chainId: CHAIN_ID) => {
  switch (chainId) {
    case CHAIN_ID.SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.OPTIMISM_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.ZORA_SEPOLIA:
      return `https://sepolia.rpc.zora.energy`;
    case CHAIN_ID.ETHEREUM:
      return `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.BASE:
      return `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.OPTIMISM:
      return `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    case CHAIN_ID.ZORA:
      return `https://rpc.zora.energy`;
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
