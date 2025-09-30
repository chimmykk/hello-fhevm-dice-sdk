// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A privacy-preserving FHE dice game contract
/// @author fhevm-hardhat-template
contract FHEDiceGame is SepoliaConfig {
    euint32 private _lastDiceRoll;
    euint32 private _playerGuess;
    ebool private _isWinner; // Encrypted winner status
    address public owner;

    uint256 public constant ENTRY_FEE = 0.0002 ether;

    // Custom errors for gas optimization
    error IncorrectEntryFee();
    error OnlyOwnerCanWithdraw();

    constructor() {
        owner = msg.sender;
    }

    /// @notice Returns the last encrypted dice roll
    function getLastDiceRoll() external view returns (euint32) {
        return _lastDiceRoll;
    }

    /// @notice Returns the player's encrypted guess
    function getPlayerGuess() external view returns (euint32) {
        return _playerGuess;
    }

    /// @notice Returns the encrypted winner status
    function getWinnerStatus() external view returns (ebool) {
        return _isWinner;
    }

    /// @notice Play the dice game with encrypted inputs
    /// @param inputSeed the encrypted seed
    /// @param seedProof the seed proof
    /// @param inputGuess the encrypted guess (1-6)
    /// @param guessProof the guess proof
    function playDice(
        externalEuint32 inputSeed,
        bytes calldata seedProof,
        externalEuint32 inputGuess,
        bytes calldata guessProof
    ) external payable {
        if (msg.value != ENTRY_FEE) revert IncorrectEntryFee();

        // Convert external encrypted inputs to internal euint32
        euint32 encryptedSeed = FHE.fromExternal(inputSeed, seedProof);
        euint32 encryptedGuess = FHE.fromExternal(inputGuess, guessProof);

        // Store encrypted values
        _playerGuess = encryptedGuess;
        _lastDiceRoll = _generateDiceRoll(encryptedSeed);

        // Core FHE Logic: Determine if the player is a winner on-chain
        _isWinner = FHE.eq(_lastDiceRoll, _playerGuess);

        // Allow the player to access their own encrypted values for off-chain decryption
        FHE.allowThis(_lastDiceRoll);
        FHE.allow(_lastDiceRoll, msg.sender);
        FHE.allowThis(_playerGuess);
        FHE.allow(_playerGuess, msg.sender);
        FHE.allowThis(_isWinner);
        FHE.allow(_isWinner, msg.sender);
    }

    /// @notice Generate a dice roll from encrypted seed
    function _generateDiceRoll(euint32 seed) internal returns (euint32) {
        euint32 salt = FHE.asEuint32(42);
        euint32 combined = FHE.add(seed, salt);
        euint32 mask = FHE.asEuint32(7);
        euint32 masked = FHE.and(combined, mask);
        euint32 one = FHE.asEuint32(1);
        euint32 result = FHE.add(masked, one);
        euint32 six = FHE.asEuint32(6);
        return FHE.min(result, six);
    }

    /// @notice Withdraw contract balance (owner only)
    function withdraw() external {
        if (msg.sender != owner) revert OnlyOwnerCanWithdraw();
        payable(owner).transfer(address(this).balance);
    }

    /// @notice Fund the contract
    receive() external payable {}
}
