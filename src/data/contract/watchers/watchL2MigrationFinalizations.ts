import { Address, parseAbiItem, parseEther } from "viem";
import { CHAIN_ID } from "../../../constants/chains";
import { getPublicClient } from "../clients/getPublicClient";
import { L2_MIGRATION_DEPLOYER } from "../../../constants/addresses";

const L1 =
  process.env.NETWORK_TYPE === "testnet" ? CHAIN_ID.GOERLI : CHAIN_ID.ETHEREUM;

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
    `${icon} Watching finalizations for address: ${L2_MIGRATION_DEPLOYER}`
  );

  const l1Client = getPublicClient(L1);
  const l2Client = getPublicClient(chainId);

  // Only process DAOs with more than 5 ETH in treasury
  const minBalanceToProcess = parseEther("0.01");

  const validateDeployer = async (deployer: Address) => {
    const l1Balance = await l1Client.getBalance({ address: deployer });

    if (l1Balance > minBalanceToProcess) return true;
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
