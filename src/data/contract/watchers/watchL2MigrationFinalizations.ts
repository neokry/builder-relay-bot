import { Address, formatEther, parseAbiItem } from "viem";
import { CHAIN_ID, L1_CHAIN_ID } from "../../../constants/chains";
import { getPublicClient } from "../clients/getPublicClient";
import { L2_MIGRATION_DEPLOYER } from "../../../constants/addresses";

export const watchL2MigrationFinalizations = ({
  icon,
  chainId,
  handleDAODeployed,
}: {
  icon: string;
  chainId: CHAIN_ID;
  handleDAODeployed: (address: Address) => void;
}) => {
  console.log(
    `${icon} Watching finalizations for address: ${L2_MIGRATION_DEPLOYER} on chain ${chainId}`
  );

  const l1Client = getPublicClient(L1_CHAIN_ID);
  const l2Client = getPublicClient(chainId);

  const MIN_BALANCE_TO_PROCESS = 0n;

  const validateDeployer = async (deployer: Address) => {
    const l1Balance = await l1Client.getBalance({ address: deployer });

    if (l1Balance > MIN_BALANCE_TO_PROCESS) return true;

    console.log(
      `L1 DAO ${deployer} balance: ${formatEther(
        l1Balance
      )} ETH less than min ${MIN_BALANCE_TO_PROCESS} ETH`
    );
    return false;
  };

  return l2Client.watchEvent({
    address: L2_MIGRATION_DEPLOYER,
    event: parseAbiItem(
      "event OwnershipRenounced(address indexed token, address indexed deployer)"
    ),
    onLogs: async (events) => {
      try {
        console.log(`${icon} Found ${events.length} finalization(s)`);
        Promise.all(
          events.map(async (x) => {
            const { token, deployer } = x.args;
            if (!deployer || !token) return;
            if (await validateDeployer(deployer)) handleDAODeployed(token);
          })
        );
      } catch (err) {
        console.error(`${icon} Failed to validate transactions`, err);
      }
    },
  });
};
