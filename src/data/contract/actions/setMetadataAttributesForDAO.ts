import { CHAIN_ID } from "../../../constants/chains";
import { Address, Hash, decodeAbiParameters, parseAbiParameters } from "viem";
import { getPublicClient } from "../clients/getPublicClient";
import { ICON_FOR_CHAIN } from "../../../constants/icon";
import { merkleMetadataAbi } from "../abis/MerkleMetadataRenderer";
import { tokenAbi } from "../abis/Token";
import { getProof, getTree } from "lanyard";
import { getWalletClient } from "../clients/getWalletClient";
import { safeSendTransaction } from "../../../utils/safeSendTransaction";

interface AttributeListItem {
  attributes: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];
  tokenId: bigint;
  leaf: string;
}

export const setMetadataAttributesForDAO = async ({
  chainId,
  token,
}: {
  chainId: CHAIN_ID;
  token: Address;
}) => {
  const icon = ICON_FOR_CHAIN[chainId];
  try {
    console.log(`${icon} Setting metadata attributes for DAO: ${token}`);

    const { list, merkleRoot, metadata } = await getAttributes({
      chainId,
      token,
    });

    console.log(`${icon} Found ${list.length} attributes for DAO: ${token}`);

    const batchSize = 100;

    let numProcessed = 0;

    while (numProcessed < list.length) {
      const batch = list.slice(numProcessed, numProcessed + batchSize);

      try {
        await batchSetAttributes({
          chainId,
          merkleRoot,
          batch,
          metadata,
          token,
        });
      } catch (err) {
        if ((err as Error).message.includes("Insufficient balance")) {
          throw new Error("Insufficient balance");
        }

        console.log(
          `${icon} Batch failed moving on to next batch for DAO: ${token}`
        );
      }

      numProcessed += batch.length;
    }

    console.log(
      `${icon} Finished setting attributes for ${numProcessed} / ${list.length} tokens for DAO: ${token}`
    );
  } catch (err) {
    console.error(`${icon} Error setting metadata attributes for DAO ${err}`);
  }
};

const batchSetAttributes = async ({
  chainId,
  metadata,
  batch,
  merkleRoot,
  token,
}: {
  chainId: CHAIN_ID;
  metadata: Address;
  token: Address;
  batch: AttributeListItem[];
  merkleRoot: Hash;
}) => {
  const icon = ICON_FOR_CHAIN[chainId];
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClient(chainId);

  const res = await Promise.all(
    batch.map((x) => getProof({ unhashedLeaf: x.leaf, merkleRoot }))
  );

  const proofs = res.map((x) => {
    if (!x?.proof) throw new Error("Invalid proof");
    return x?.proof as Hash[];
  });

  const args = batch.map((x, i) => {
    return {
      tokenId: x.tokenId,
      attributes: x.attributes,
      proof: proofs[i],
    };
  });

  if (!walletClient.account) throw new Error("Invalid account");
  console.log(
    `${icon} Simulating batch of ${args.length} attributes for DAO: ${token}`
  );

  // Check if simulation passes
  const { request } = await publicClient.simulateContract({
    abi: merkleMetadataAbi,
    account: walletClient.account,
    chain: walletClient.chain,
    address: metadata,
    functionName: "setManyAttributes",
    args: [args],
  });

  console.log(
    `${icon} Simulating successful now setting ${args.length} attributes for DAO: ${token}`
  );

  const gasEstimated = await publicClient.estimateContractGas(request);

  const txReceipt = await safeSendTransaction({
    request,
    gasBase: 0n,
    gasBufferRatio: 3n,
    gasEstimated,
    chainId,
  });

  console.log(
    `${icon} Set attributes for ${batch.length} tokens for DAO: ${token} tx: ${txReceipt.transactionHash}`
  );
};

const getAttributes = async ({
  chainId,
  token,
}: {
  chainId: CHAIN_ID;
  token: Address;
}) => {
  const publicClient = getPublicClient(chainId);

  const metadata = await publicClient.readContract({
    abi: tokenAbi,
    address: token,
    functionName: "metadataRenderer",
  });

  const merkleRoot = await publicClient.readContract({
    abi: merkleMetadataAbi,
    address: metadata,
    functionName: "attributeMerkleRoot",
  });

  const leaves = await getTree(merkleRoot).then((x) => x?.unhashedLeaves);
  if (!leaves) throw new Error("Invalid merkle root");

  const list = await leaves.map((x) => {
    const [tokenId, attributes] = decodeAbiParameters(
      parseAbiParameters("uint256 tokenId, uint16[16] attributes"),
      x as Hash
    );

    return { attributes, tokenId: tokenId, leaf: x };
  });

  return { list, merkleRoot, metadata };
};
