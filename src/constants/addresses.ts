import { Address } from "viem";
import { CHAIN_ID } from "./chains";

export const L1OptimismPortal = {
  [CHAIN_ID.ETHEREUM]: "0x0" as Address,
  [CHAIN_ID.GOERLI]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM]: "0x0" as Address,
  [CHAIN_ID.OPTIMISM_GOERLI]: "0x0" as Address,
  [CHAIN_ID.ZORA]: "0x0" as Address,
  [CHAIN_ID.ZORA_GOERLI]: "0x0" as Address,
  [CHAIN_ID.BASE]: "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e" as Address,
  [CHAIN_ID.BASE_GOERLI]:
    "0xe93c8cD0D409341205A592f8c4Ac1A5fe5585cfA" as Address,
};

export const L2DeployHelper = "0x7d6e75e6d71b1363c3cfeac82a2c540737c73210";
