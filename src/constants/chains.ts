import {
  mainnet,
  goerli,
  optimism,
  optimismGoerli,
  base,
  baseGoerli,
  zora,
  zoraTestnet,
  Chain,
} from "viem/chains";

export const enum CHAIN_ID {
  ETHEREUM = 1,
  GOERLI = 5,
  OPTIMISM = 10,
  OPTIMISM_GOERLI = 420,
  BASE = 8453,
  BASE_GOERLI = 84531,
  ZORA = 7777777,
  ZORA_GOERLI = 999,
}

export const ALL_CHAINS: Chain[] = [
  mainnet,
  goerli,
  optimism,
  optimismGoerli,
  base,
  baseGoerli,
  zora,
  zoraTestnet,
];
