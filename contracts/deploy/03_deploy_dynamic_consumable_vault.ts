import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

interface ConstructorArgs {
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
    totalUsesPerConsumer: 1,
    tokenAddress: usdtAddress,
    voucherValue: 100,
  };
  await deploy("DynamicVault", {
    from: deployer,
    log: true,
    //   bytes32 _merkleRoot, uint256 _totalUsesPerConsumer, address _tokenAddress, uint256 _voucherValue
    args: [constructorArgs.totalUsesPerConsumer, constructorArgs.tokenAddress, constructorArgs.voucherValue],
  });
  const vaultDeployment = await deployments.get("DynamicVault");
  const vaultAddress = vaultDeployment.address;
  console.log("DynamicVault deployed at: ", vaultAddress, "\n");
};

export default func;
func.tags = ["all", "dynamic-vault"];
func.dependencies = ["usdt"];
