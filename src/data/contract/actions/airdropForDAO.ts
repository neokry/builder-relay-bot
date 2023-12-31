import { getTree, getProof } from "lanyard";
import { getPublicClient } from "../clients/getPublicClient";
import { CHAIN_ID } from "../../../constants/chains";
import { merkleReserveMinterAbi } from "../abis/MerkleReserveMinter";
import { MERKLE_RESERVE_MINTER } from "../../../constants/addresses";
import { Address, Hash, decodeAbiParameters, parseAbiParameters } from "viem";
import { getWalletClient } from "../clients/getWalletClient";
import { ICON_FOR_CHAIN } from "../../../constants/icon";
import { tokenAbi } from "../abis/Token";

export interface AllowListItem {
  claimant: Address;
  tokenId: bigint;
  leaf: string;
}

export const airdropForDAO = async ({
  chainId,
  token,
}: {
  chainId: CHAIN_ID;
  token: Address;
}) => {
  const icon = ICON_FOR_CHAIN[chainId];
  try {
    const publicClient = getPublicClient(chainId);
    console.log(`${icon} Airdropping for DAO: ${token}`);

    const reservedUntil = await publicClient.readContract({
      abi: tokenAbi,
      address: token,
      functionName: "reservedUntilTokenId",
    });

    const { list, merkleRoot } = await getAllowlist({ chainId, token });

    console.log(
      `${icon} Found allowlist with ${list.length} items for DAO: ${token}`
    );

    if (list.length > 1000) throw new Error("Too many claims");

    const batchSize = 10;
    const maxFailuresForBatch = 3;

    let numProcessed = 0;
    let numMinted = 0;
    let failureCountForBatch = 0;

    while (numProcessed < list.length) {
      try {
        const batch = list.slice(numProcessed, numProcessed + batchSize);

        const baseCall = {
          abi: tokenAbi,
          address: token,
          functionName: "ownerOf",
        } as const;

        const contructedCalls = batch.map((x) => ({
          ...baseCall,
          args: [BigInt(x.tokenId)],
        }));

        const res = await publicClient.multicall({
          contracts: contructedCalls,
        });

        const isMinted = res.map((x) => !x.error);

        const validMints = batch
          .filter((_, i) => !isMinted[i])
          .filter((x) => x.tokenId < reservedUntil);

        if (validMints.length > 0) {
          await airdropBatch({ merkleRoot, chainId, token, batch: validMints });
          numMinted += validMints.length;
        }

        numProcessed += batchSize;
        failureCountForBatch = 0;
      } catch (err) {
        if (failureCountForBatch++ > maxFailuresForBatch)
          throw new Error("Airdrop consistently failing");

        console.warn(`${icon} Error airdropping batch: ${err}`);

        // Wait 5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log(
      `${icon} Finished airdropping ${numMinted} / ${list.length} tokens for DAO: ${token}`
    );
  } catch (err) {
    console.error(`${icon} Error airdropping for DAO ${err}`);
  }
};

const airdropBatch = async ({
  merkleRoot,
  chainId,
  token,
  batch,
}: {
  merkleRoot: Hash;
  chainId: CHAIN_ID;
  token: Address;
  batch: AllowListItem[];
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

  const claims = batch.map((x, i) => {
    return {
      mintTo: x.claimant,
      tokenId: BigInt(x.tokenId),
      merkleProof: proofs[i],
    };
  });

  if (!walletClient.account) throw new Error("Invalid account");
  console.log(
    `${icon} Simulating batch of ${claims.length} claims for DAO: ${token}`
  );

  // Check if simulation passes
  const { request } = await publicClient.simulateContract({
    abi: merkleReserveMinterAbi,
    account: walletClient.account,
    chain: walletClient.chain,
    address: MERKLE_RESERVE_MINTER,
    functionName: "mintFromReserve",
    args: [token, claims],
  });

  console.log(
    `${icon} Simulating successful now minting ${claims.length} tokens for DAO: ${token}`
  );

  const hash = await walletClient.writeContract(request);

  await publicClient.waitForTransactionReceipt({ hash });

  console.log(
    `${icon} Airdropped: ${batch.length} tokens for DAO: ${token} tx: ${hash}`
  );
};

const getAllowlist = async ({
  chainId,
  token,
}: {
  chainId: CHAIN_ID;
  token: Address;
}) => {
  const publicClient = getPublicClient(chainId);
  const [mintStart, mintEnd, pricePerToken, merkleRoot] =
    await publicClient.readContract({
      abi: merkleReserveMinterAbi,
      address: MERKLE_RESERVE_MINTER,
      functionName: "allowedMerkles",
      args: [token],
    });

  const now = BigInt(Math.round(Date.now() / 1000));

  console.log(now, " ", mintEnd);

  if (mintStart > now) throw new Error("Claim not started");
  if (mintEnd < now) throw new Error("Claim expired");
  if (pricePerToken > 0n) throw new Error("Claim price not 0");

  const leaves = await getTree(merkleRoot).then((x) => x?.unhashedLeaves);
  if (!leaves) throw new Error("Invalid merkle root");

  const list = await leaves.map((x) => {
    const [claimant, tokenId] = decodeAbiParameters(
      parseAbiParameters("address claimant, uint256 tokenId"),
      x as Hash
    );

    return { claimant, tokenId: tokenId, leaf: x };
  });

  return { list, merkleRoot };
};
