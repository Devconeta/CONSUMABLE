import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

interface ConstructorArgs {
  root: string;
  totalUsesPerConsumer: number;
  tokenAddress: string;
  voucherValue: number;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  /* 1. Recover USDT from deployments */
  const usdtDeployment = await deployments.get("USDT");
  const usdtAddress = usdtDeployment.address;
  console.log("Using USDT deployed at: ", usdtAddress);

  console.log("Vault deployer: ", deployer);

  /* 2. Deploy Vault */
  const constructorArgs: ConstructorArgs = {
    root: "0x7c051167362941338293b69a56e14425db2dd23de7cee321c504981379214fe0",
    totalUsesPerConsumer: 1,
    tokenAddress: usdtAddress,
    voucherValue: 100,
  };
  await deploy("Vault", {
    from: deployer,
    log: true,
    //   bytes32 _merkleRoot, uint256 _totalUsesPerConsumer, address _tokenAddress, uint256 _voucherValue
    args: [constructorArgs.root, constructorArgs.totalUsesPerConsumer, constructorArgs.tokenAddress, constructorArgs.voucherValue],
  });
  const vaultDeployment = await deployments.get("Vault");
  const vaultAddress = vaultDeployment.address;
  console.log("Vault deployed at: ", vaultAddress, "\n");
};

export default func;
func.tags = ["all", "vault"];
func.dependencies = ["usdt"];
