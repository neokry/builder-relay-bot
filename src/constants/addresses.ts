import { Address } from "viem";
import { CHAIN_ID } from "./chains";

export const L1_CROSS_DOMAIN_MESSENGER = {
  [CHAIN_ID.ETHEREUM]: "0x0" as Address,
  [CHAIN_ID.GOERLI]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM_GOERLI]: "0x0" as Address,
  [CHAIN_ID.ZORA]: "0x0" as Address,
  [CHAIN_ID.ZORA_GOERLI]: "0x0" as Address,
  [CHAIN_ID.BASE]: "0x866E82a600A1414e583f7F13623F1aC5d58b0Afa" as Address,
  [CHAIN_ID.BASE_GOERLI]:
    "0x8e5693140ea606bceb98761d9beb1bc87383706d" as Address,
};

export const L2_CROSS_DOMAIN_MESSENGER =
  "0x4200000000000000000000000000000000000007";

export const L2_MIGRATION_DEPLOYER =
  "0x3A4996be5586E55c165c7Ce2666cEe61Ca0deebe";

export const MERKLE_RESERVE_MINTER =
  "0x088b9066B765D47E56d477D78Bd0D5400Aead99E";
