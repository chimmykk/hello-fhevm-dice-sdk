import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEDiceGame } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("FHEDiceGame");
  const fheDiceGameContract = (await factory.deploy()) as FHEDiceGame;
  const fheDiceGameContractAddress = await fheDiceGameContract.getAddress();

  return { fheDiceGameContract, fheDiceGameContractAddress };
}

describe("FHEDiceGame", function () {
  let signers: Signers;
  let fheDiceGameContract: FHEDiceGame;
  let fheDiceGameContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ fheDiceGameContract, fheDiceGameContractAddress } = await deployFixture());
  });

  it("encrypted dice roll should be uninitialized after deployment", async function () {
    const encryptedDiceRoll = await fheDiceGameContract.getLastDiceRoll();
    // Expect initial dice roll to be bytes32(0) after deployment,
    // (meaning the encrypted dice roll value is uninitialized)
    expect(encryptedDiceRoll).to.eq(ethers.ZeroHash);
  });

  it("encrypted player guess should be uninitialized after deployment", async function () {
    const encryptedPlayerGuess = await fheDiceGameContract.getPlayerGuess();
    // Expect initial player guess to be bytes32(0) after deployment,
    // (meaning the encrypted player guess value is uninitialized)
    expect(encryptedPlayerGuess).to.eq(ethers.ZeroHash);
  });

  it("should play dice game and generate valid dice roll", async function () {
    const encryptedDiceRollBefore = await fheDiceGameContract.getLastDiceRoll();
    expect(encryptedDiceRollBefore).to.eq(ethers.ZeroHash);
    const encryptedPlayerGuessBefore = await fheDiceGameContract.getPlayerGuess();
    expect(encryptedPlayerGuessBefore).to.eq(ethers.ZeroHash);

    // Encrypt seed value
    const seedValue = 12345;
    const encryptedSeed = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(seedValue)
      .encrypt();

    // Encrypt guess value (1-6)
    const guessValue = 4;
    const encryptedGuess = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(guessValue)
      .encrypt();

    // Play the dice game with correct entry fee
    const entryFee = ethers.parseEther("0.0002");
    const tx = await fheDiceGameContract
      .connect(signers.alice)
      .playDice(
        encryptedSeed.handles[0],
        encryptedSeed.inputProof,
        encryptedGuess.handles[0],
        encryptedGuess.inputProof,
        { value: entryFee },
      );
    await tx.wait();

    // Get and decrypt the dice roll
    const encryptedDiceRollAfter = await fheDiceGameContract.getLastDiceRoll();
    const clearDiceRoll = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDiceRollAfter,
      fheDiceGameContractAddress,
      signers.alice,
    );

    // Get and decrypt the player guess
    const encryptedPlayerGuessAfter = await fheDiceGameContract.getPlayerGuess();
    const clearPlayerGuess = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedPlayerGuessAfter,
      fheDiceGameContractAddress,
      signers.alice,
    );

    // Verify dice roll is between 1 and 6
    expect(clearDiceRoll).to.be.greaterThanOrEqual(1);
    expect(clearDiceRoll).to.be.lessThanOrEqual(6);

    // Verify player guess matches what we sent
    expect(clearPlayerGuess).to.eq(guessValue);
  });

  it("should play multiple games and track last values correctly", async function () {
    const entryFee = ethers.parseEther("0.0002");

    // First game
    const seedValue1 = 11111;
    const guessValue1 = 2;
    const encryptedSeed1 = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(seedValue1)
      .encrypt();
    const encryptedGuess1 = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(guessValue1)
      .encrypt();

    let tx = await fheDiceGameContract
      .connect(signers.alice)
      .playDice(
        encryptedSeed1.handles[0],
        encryptedSeed1.inputProof,
        encryptedGuess1.handles[0],
        encryptedGuess1.inputProof,
        { value: entryFee },
      );
    await tx.wait();

    // Second game with different values
    const seedValue2 = 22222;
    const guessValue2 = 5;
    const encryptedSeed2 = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(seedValue2)
      .encrypt();
    const encryptedGuess2 = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(guessValue2)
      .encrypt();

    tx = await fheDiceGameContract
      .connect(signers.alice)
      .playDice(
        encryptedSeed2.handles[0],
        encryptedSeed2.inputProof,
        encryptedGuess2.handles[0],
        encryptedGuess2.inputProof,
        { value: entryFee },
      );
    await tx.wait();

    // Verify the contract tracks the LAST game's values
    const encryptedDiceRoll = await fheDiceGameContract.getLastDiceRoll();
    const clearDiceRoll = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDiceRoll,
      fheDiceGameContractAddress,
      signers.alice,
    );

    const encryptedPlayerGuess = await fheDiceGameContract.getPlayerGuess();
    const clearPlayerGuess = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedPlayerGuess,
      fheDiceGameContractAddress,
      signers.alice,
    );

    // Should have the values from the second (last) game
    expect(clearDiceRoll).to.be.greaterThanOrEqual(1);
    expect(clearDiceRoll).to.be.lessThanOrEqual(6);
    expect(clearPlayerGuess).to.eq(guessValue2);
  });

  it("should revert with incorrect entry fee", async function () {
    // Encrypt seed and guess values
    const seedValue = 98765;
    const guessValue = 3;

    const encryptedSeed = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(seedValue)
      .encrypt();

    const encryptedGuess = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(guessValue)
      .encrypt();

    // Try with incorrect entry fee (too low)
    const incorrectFee = ethers.parseEther("0.0001");
    await expect(
      fheDiceGameContract
        .connect(signers.alice)
        .playDice(
          encryptedSeed.handles[0],
          encryptedSeed.inputProof,
          encryptedGuess.handles[0],
          encryptedGuess.inputProof,
          { value: incorrectFee },
        ),
    ).to.be.revertedWithCustomError(fheDiceGameContract, "IncorrectEntryFee");
  });

  it("should allow owner to withdraw funds", async function () {
    // First, add some funds by playing the game
    const seedValue = 54321;
    const guessValue = 6;

    const encryptedSeed = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(seedValue)
      .encrypt();

    const encryptedGuess = await fhevm
      .createEncryptedInput(fheDiceGameContractAddress, signers.alice.address)
      .add32(guessValue)
      .encrypt();

    const entryFee = ethers.parseEther("0.0002");
    await fheDiceGameContract
      .connect(signers.alice)
      .playDice(
        encryptedSeed.handles[0],
        encryptedSeed.inputProof,
        encryptedGuess.handles[0],
        encryptedGuess.inputProof,
        { value: entryFee },
      );

    // Get contract balance before withdrawal
    const contractBalanceBefore = await ethers.provider.getBalance(fheDiceGameContractAddress);
    expect(contractBalanceBefore).to.be.greaterThan(0);

    // Owner withdraws funds
    const tx = await fheDiceGameContract.connect(signers.deployer).withdraw();
    await tx.wait();

    // Check contract balance is now 0
    const contractBalanceAfter = await ethers.provider.getBalance(fheDiceGameContractAddress);
    expect(contractBalanceAfter).to.eq(0);
  });

  it("should prevent non-owner from withdrawing", async function () {
    await expect(fheDiceGameContract.connect(signers.alice).withdraw()).to.be.revertedWithCustomError(
      fheDiceGameContract,
      "OnlyOwnerCanWithdraw",
    );
  });
});
