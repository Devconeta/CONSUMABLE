import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Vault deployer: ", deployer);

  await deploy("USDT", {
    from: deployer,
    log: true,
    // address initialOwner
    args: [deployer],
  });

  const usdtDeployment = await deployments.get("USDT");
  const usdtAddress = usdtDeployment.address;
  console.log("USDT deployed at: ", usdtAddress, "\n");
};

export default func;
func.tags = ["all", "usdt"];
