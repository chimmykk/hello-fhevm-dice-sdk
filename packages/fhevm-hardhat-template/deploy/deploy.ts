// deploy/01_deploy_fhe_dice_game.ts

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHEDiceGame = await deploy("FHEDiceGame", {
    from: deployer,
    log: true,
  });

  console.log(`FHEDiceGame contract deployed to: ${deployedFHEDiceGame.address}`);
};
export default func;
func.id = "deploy_fhe_dice_game";
func.tags = ["FHEDiceGame"];
