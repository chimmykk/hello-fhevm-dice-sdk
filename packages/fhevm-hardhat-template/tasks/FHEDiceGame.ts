import { task } from "hardhat/config";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * Example:
 *   - npx hardhat --network localhost task:dice-address
 *   - npx hardhat --network sepolia task:dice-address
 */
task("task:dice-address", "Prints the FHEDiceGame address").setAction(async function (_taskArguments, hre) {
  const { deployments } = hre;
  const fheDice = await deployments.get("FHEDiceGame");
  console.log("FHEDiceGame address is " + fheDice.address);
});


/**
 * Example:
 *   - npx hardhat --network localhost task:play-dice --guess 4 --seed 12345
 *   - npx hardhat --network sepolia task:play-dice --guess 2 --seed 54321
 */
task("task:play-dice", "Play FHEDiceGame by providing guess and seed")
  .addParam("guess", "The dice guess between 1 and 6")
  .addParam("seed", "Random seed for dice roll")
  .addOptionalParam("address", "Optionally specify the FHEDiceGame contract address")
  .setAction(async function (taskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const guess = parseInt(taskArguments.guess);
    const seed = parseInt(taskArguments.seed);

    if (!Number.isInteger(guess) || guess < 1 || guess > 6) {
      throw new Error(`--guess must be integer between 1 and 6`);
    }
    if (!Number.isInteger(seed)) {
      throw new Error(`--seed must be an integer`);
    }

    await fhevm.initializeCLIApi();

    const FHEDiceDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEDiceGame");

    console.log(`FHEDiceGame: ${FHEDiceDeployment.address}`);

    const [signer] = await ethers.getSigners();
    const fheDiceContract = await ethers.getContractAt("FHEDiceGame", FHEDiceDeployment.address);

    // Encrypt seed and guess
    const encryptedSeed = await fhevm
      .createEncryptedInput(FHEDiceDeployment.address, signer.address)
      .add32(seed)
      .encrypt();

    const encryptedGuess = await fhevm
      .createEncryptedInput(FHEDiceDeployment.address, signer.address)
      .add32(guess)
      .encrypt();

    // Get entry fee
    const entryFee = await fheDiceContract.ENTRY_FEE();
    console.log(`💰 Entry fee: ${ethers.formatEther(entryFee)} ETH`);

    // Send tx
    const tx = await fheDiceContract
      .connect(signer)
      .playDice(
        encryptedSeed.handles[0],
        encryptedSeed.inputProof,
        encryptedGuess.handles[0],
        encryptedGuess.inputProof,
        { value: entryFee },
      );

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`FHEDiceGame playDice(guess=${guess}, seed=${seed}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:dice-result
 *   - npx hardhat --network sepolia task:dice-result
 */
task("task:dice-result", "Fetch the last dice roll and winner status")
  .addOptionalParam("address", "Optionally specify the FHEDiceGame contract address")
  .setAction(async function (taskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const FHEDiceDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEDiceGame");
    console.log(`FHEDiceGame: ${FHEDiceDeployment.address}`);

    const [signer] = await ethers.getSigners();
    const fheDiceContract = await ethers.getContractAt("FHEDiceGame", FHEDiceDeployment.address);

    const encryptedDiceRoll = await fheDiceContract.getLastDiceRoll();
    const encryptedWinnerStatus = await fheDiceContract.getWinnerStatus();

    if (encryptedDiceRoll === ethers.ZeroHash) {
      console.log("No game played yet.");
      return;
    }

    const clearDiceRoll = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDiceRoll,
      FHEDiceDeployment.address,
      signer,
    );

     const clearWinnerStatus = await fhevm.userDecryptEbool(
      encryptedWinnerStatus,
      FHEDiceDeployment.address,
      signer,
    );

    console.log("Encrypted Dice Roll   :", encryptedDiceRoll);
    console.log("Clear Dice Roll       :", clearDiceRoll.toString());
    console.log("Encrypted Winner Stat :", encryptedWinnerStatus);
    console.log("Clear Winner Stat     :", clearWinnerStatus.toString());
  });
