import { Address } from "viem";
import { CHAIN_ID } from "./chains";

export const L1CrossDomainMessenger = {
  [CHAIN_ID.ETHEREUM]: "0x0" as Address,
  [CHAIN_ID.GOERLI]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM_GOERLI]: "0x0" as Address,
  [CHAIN_ID.ZORA]: "0x0" as Address,
  [CHAIN_ID.ZORA_GOERLI]: "0x0" as Address,
  [CHAIN_ID.BASE]: "0x866E82a600A1414e583f7F13623F1aC5d58b0Afa" as Address,
  [CHAIN_ID.BASE_GOERLI]:
    "0x8e5693140eA606bcEB98761d9beB1BC87383706D" as Address,
};

export const L2_CROSS_DOMAIN_MESSENGER =
  "0x4200000000000000000000000000000000000007";

export const L2_MIGRATION_DEPLOYER =
  "0x699305aDF50CAffDC374067f37B8e2AF59814823";
