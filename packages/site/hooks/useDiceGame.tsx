import { SetStateAction, useEffect, useState } from 'react';
import { BrowserProvider, Contract, parseEther, hexlify, BytesLike } from 'ethers';

// Extend Window interface for ethereum and relayerSDK
declare global {
  interface Window {
    ethereum?: any;
    relayerSDK?: any;
  }
}

type ShowToastFunction = (message: string, type?: "success" | "error" | "warning" | "info") => void;
type SetTxStatusFunction = (value: SetStateAction<string>) => void;

// Hook for interacting with FHEDiceGame contract
export const useDiceGame = (
  account: `0x${string}` | undefined, 
  showToast: ShowToastFunction, 
  setTxStatus: SetTxStatusFunction, 
  contractAddress: `0x${string}` | undefined
) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [entryFeeWei, setEntryFeeWei] = useState<bigint | null>(null);
  const [encryptedState, setEncryptedState] = useState<{
    lastDiceRoll: string;
    playerGuess: string;
    winnerStatus: string;
  }>({
    lastDiceRoll: '0x',
    playerGuess: '0x',
    winnerStatus: '0x'
  });
  const [decryptedState, setDecryptedState] = useState<{
    lastDiceRoll: number | null;
    playerGuess: number | null;
    winnerStatus: boolean | null;
  }>({
    lastDiceRoll: null,
    playerGuess: null,
    winnerStatus: null
  });
  const [fairness, setFairness] = useState<{
    seed: number;
    guess: number;
    commitment: string;
    txHash: string;
  } | null>(null);

  const abi = [
    "function ENTRY_FEE() view returns (uint256)",
    "function owner() view returns (address)",
    "function getLastDiceRoll() view returns (bytes32)",
    "function getPlayerGuess() view returns (bytes32)",
    "function getWinnerStatus() view returns (bytes32)",
    "function playDice(bytes32,bytes,bytes32,bytes) payable",
    "function withdraw()"
  ];

  useEffect(() => {
    if (!account || !window.ethereum || !contractAddress) return;
    const init = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const c = new Contract(contractAddress, abi, signer);
        setContract(c);
        try {
          const fee = await c.ENTRY_FEE();
          setEntryFeeWei(fee);
        } catch {}
        await refreshEncryptedState(c);
      } catch (err) {
        console.error('Error initializing FHEDiceGame contract:', err);
      }
    };
    init();
  }, [account, contractAddress]);

  const refreshEncryptedState = async (c?: Contract) => {
    try {
      const contractToUse = c || contract;
      if (!contractToUse) return;
      
      const [lastDiceRoll, playerGuess, winnerStatus] = await Promise.all([
        contractToUse.getLastDiceRoll(),
        contractToUse.getPlayerGuess(),
        contractToUse.getWinnerStatus()
      ]);
      setEncryptedState({
        lastDiceRoll,
        playerGuess,
        winnerStatus
      });
    } catch (err) {
      console.error('Failed to load encrypted state:', err);
    }
  };

  const playDice = async (seedNumber: number, guessNumber: number) => {
    if (!contract) return;
    if (
      typeof seedNumber !== 'number' || Number.isNaN(seedNumber) ||
      typeof guessNumber !== 'number' || Number.isNaN(guessNumber) ||
      guessNumber < 1 || guessNumber > 6
    ) {
      showToast('Enter a valid seed and a guess between 1-6', 'warning');
      return;
    }

    setLoading(true);
    setTxStatus('Encrypting seed and guess...');
    try {
      // Initialize FHEVM Relayer SDK
      if (!window.relayerSDK) throw new Error('Relayer SDK not loaded');
      await window.relayerSDK.initSDK();
      const config = { ...window.relayerSDK.SepoliaConfig, network: window.ethereum };
      const fhevm = await window.relayerSDK.createInstance(config);

      // Prepare encrypted inputs (handles + proofs) using add32 flow
      const seedInput = await fhevm.createEncryptedInput(contractAddress, account);
      await seedInput.add32(seedNumber);
      const seedEnc = await seedInput.encrypt();

      const guessInput = await fhevm.createEncryptedInput(contractAddress, account);
      await guessInput.add32(guessNumber);
      const guessEnc = await guessInput.encrypt();

      // Extract handles and proofs in a robust way
      const firstSeed = (seedEnc.handles && seedEnc.handles[0]) || seedEnc.handle || seedEnc.inputHandle;
      const firstGuess = (guessEnc.handles && guessEnc.handles[0]) || guessEnc.handle || guessEnc.inputHandle;
      let seedHandle = typeof firstSeed === 'object' && firstSeed?.handle ? firstSeed.handle : firstSeed;
      let guessHandle = typeof firstGuess === 'object' && firstGuess?.handle ? firstGuess.handle : firstGuess;
      let seedProof = seedEnc.inputProof || seedEnc.proof;
      let guessProof = guessEnc.inputProof || guessEnc.proof;

      // Normalize to hex strings (0x...)
        const toHex = (v: BytesLike | undefined): string => {
          if (!v) return '0x';
          if (typeof v === 'string') return v.startsWith('0x') ? v : `0x${v}`;
          try { return hexlify(v); } catch { return '0x'; }
        };
      const padToBytes32 = (hex: string): string => {
        if (!hex) return '0x0000000000000000000000000000000000000000000000000000000000000000';
        let h = hex.toLowerCase();
        if (!h.startsWith('0x')) h = `0x${h}`;
        h = h.replace(/^0x/, '');
        if (h.length > 64) h = h.slice(h.length - 64); // keep last 32 bytes
        return '0x' + h.padStart(64, '0');
      };
      seedHandle = toHex(seedHandle);
      guessHandle = toHex(guessHandle);
      seedProof = toHex(seedProof);
      guessProof = toHex(guessProof);

      // Ensure handles are exactly bytes32
      seedHandle = padToBytes32(seedHandle);
      guessHandle = padToBytes32(guessHandle);

      if (!seedHandle || !seedProof || !guessHandle || !guessProof) {
        showToast('Encryption output missing handle or proof', 'error');
        setLoading(false);
        setTxStatus('');
        return;
      }

      // Compute fairness commitment: sha256(seed)
      const buffer = new TextEncoder().encode(String(seedNumber));
      const digest = await window.crypto.subtle.digest('SHA-256', buffer);
      const bytes = Array.from(new Uint8Array(digest));
      const commitment = '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');

      setTxStatus('Submitting playDice transaction...');
      const tx = await contract.playDice(
        seedHandle,
        seedProof,
        guessHandle,
        guessProof,
        { value: entryFeeWei ?? parseEther('0.0002') }
      );
      await tx.wait();

      // Record fairness information
      setFairness({ seed: seedNumber, guess: guessNumber, commitment, txHash: tx.hash });

      showToast('Dice played successfully! 🎲', 'success');
      await refreshEncryptedState();
    } catch (err: any) {
      console.error('playDice failed:', err);
      showToast('playDice failed: ' + (err?.message || String(err)), 'error');
    } finally {
      setLoading(false);
      setTxStatus('');
    }
  };

  const decryptLastDiceRoll = async () => {
    if (!encryptedState.lastDiceRoll || encryptedState.lastDiceRoll === '0x') return;
    setTxStatus('Decrypting last dice roll...');
    try {
      const value = await userDecryptValue(encryptedState.lastDiceRoll, 'uint32');
      setDecryptedState(prev => ({ ...prev, lastDiceRoll: Number(value) }));
      showToast('Decrypted last roll ✅', 'success');
    } catch (err: any) {
      console.error('Decrypt last roll failed:', err);
      showToast('Decrypt failed: ' + (err?.message || String(err)), 'error');
    } finally {
      setTxStatus('');
    }
  };

  const decryptPlayerGuess = async () => {
    if (!encryptedState.playerGuess || encryptedState.playerGuess === '0x') return;
    setTxStatus('Decrypting your guess...');
    try {
      const value = await userDecryptValue(encryptedState.playerGuess, 'uint32');
      setDecryptedState(prev => ({ ...prev, playerGuess: Number(value) }));
      showToast('Decrypted your guess ✅', 'success');
    } catch (err: any) {
      console.error('Decrypt guess failed:', err);
      showToast('Decrypt failed: ' + (err?.message || String(err)), 'error');
    } finally {
      setTxStatus('');
    }
  };

  const decryptWinnerStatus = async () => {
    if (!encryptedState.winnerStatus || encryptedState.winnerStatus === '0x') return;
    setTxStatus('Decrypting winner status...');
    try {
      const value = await userDecryptValue(encryptedState.winnerStatus, 'bool');
      const isWinner = Boolean(value);
      setDecryptedState(prev => ({ ...prev, winnerStatus: isWinner }));
      showToast(isWinner ? '🎉 You won!' : 'Not a winner this time', 'info');
    } catch (err: any) {
      console.error('Decrypt winner failed:', err);
      showToast('Decrypt failed: ' + (err?.message || String(err)), 'error');
    } finally {
      setTxStatus('');
    }
  };

  // Robust user decryption helper using EIP-712 flow
  const userDecryptValue = async (ciphertextHandle: string, valueType: 'uint32' | 'bool'): Promise<number | boolean> => {
    if (!window.relayerSDK || !window.ethereum) throw new Error('Relayer SDK or Ethereum not available');
    
    await window.relayerSDK.initSDK();
    const config = { ...window.relayerSDK.SepoliaConfig, network: window.ethereum };
    const instance = await window.relayerSDK.createInstance(config);

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    const keypair = instance.generateKeypair();
    const handleContractPairs = [
      { handle: ciphertextHandle, contractAddress }
    ];
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';
    const contractAddresses = [contractAddress];

    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );

    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      signerAddress,
      startTimeStamp,
      durationDays
    );

    const raw = result[ciphertextHandle];
    if (valueType === 'bool') {
      return raw === true || raw === 'true' || raw === 1 || raw === '1';
    }
    // Default to uint32 number
    return Number(raw);
  };

  return {
    contract,
    loading,
    encryptedState,
    decryptedState,
    fairness,
    playDice,
    refreshEncryptedState,
    decryptLastDiceRoll,
    decryptPlayerGuess,
    decryptWinnerStatus
  };
};
