import {
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  zora,
  zoraSepolia,
  Chain,
} from "viem/chains";

export const enum CHAIN_ID {
  ETHEREUM = 1,
  SEPOLIA = 11155111,
  OPTIMISM = 10,
  OPTIMISM_SEPOLIA = 11155420,
  BASE = 8453,
  BASE_SEPOLIA = 84532,
  ZORA = 7777777,
  ZORA_SEPOLIA = 999999999,
}

export const ALL_CHAINS: Chain[] = [
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  zora,
  zoraSepolia,
];

const isTestnet = process.env.NETWORK_TYPE === "testnet";

export const CHAINS_TO_WATCH = isTestnet
  ? [CHAIN_ID.BASE_SEPOLIA, CHAIN_ID.OPTIMISM_SEPOLIA, CHAIN_ID.ZORA_SEPOLIA]
  : [CHAIN_ID.BASE, CHAIN_ID.OPTIMISM, CHAIN_ID.ZORA];

export const L1_CHAIN_ID = isTestnet ? CHAIN_ID.SEPOLIA : CHAIN_ID.ETHEREUM;
