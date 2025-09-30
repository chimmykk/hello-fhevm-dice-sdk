"use client";

import { useFhevm } from "@fhevm/react";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useDiceGame } from "../hooks/useDiceGame";
import { ErrorNotDeployed } from "./ErrorNotDeployed";
import { useState, useEffect } from "react";
import { ConnectButton } from "./ConnectButton";
import PlayDice from "./PlayDice";
import DiceResults from "./DiceResults";
import { FHEDiceGameAddresses } from "@/abi/FHEDiceGameAddresses";

export const DiceNarration = () => {
  const [isClient, setIsClient] = useState(false);
  
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
  } = useMetaMaskEthersSigner();

  const {
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains: [],
    enabled: true,
  });

  const [txStatus, setTxStatus] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const contractAddress = chainId ? 
    FHEDiceGameAddresses[chainId.toString() as keyof typeof FHEDiceGameAddresses]?.address : 
    undefined;

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const diceGame = useDiceGame(
    accounts?.[0] as `0x${string}` | undefined,
    showToast,
    setTxStatus,
    contractAddress as `0x${string}` | undefined
  );

  const isDeployed = contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000';

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className="grid w-full gap-4">
        <div className="col-span-full mx-20 bg-black text-white">
          <p className="font-bold text-2xl m-5">
            <span className="font-mono font-normal text-gray-400">
              Encrypted Dice Game powered by Zama FHEVM
            </span>
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectButton isConnected={isConnected} connect={connect} />;
  }

  if (!isDeployed) {
    return <ErrorNotDeployed chainId={chainId} />;
  }

  return (
    <div className="grid w-full gap-4">
      <div className="col-span-full mx-20 bg-black text-white">
        <p className="font-bold text-2xl m-5">
          <span className="font-mono font-normal text-gray-400">
            Encrypted Dice Game powered by Zama FHEVM
          </span>
        </p>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          toast.type === 'warning' ? 'bg-yellow-500 text-black' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Transaction status */}
      {txStatus && (
        <div className="fixed top-16 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg z-50">
          {txStatus}
        </div>
      )}

      {/* Play Dice Component */}
      <PlayDice 
        loading={diceGame.loading}
        onPlay={diceGame.playDice}
      />

      {/* Dice Results Component */}
      <DiceResults
        encrypted={diceGame.encryptedState}
        decrypted={diceGame.decryptedState}
        onDecryptRoll={diceGame.decryptLastDiceRoll}
        onDecryptGuess={diceGame.decryptPlayerGuess}
        onDecryptWinner={diceGame.decryptWinnerStatus}
        loading={diceGame.loading}
        fairness={diceGame.fairness}
      />

      {/* Technical Details */}
      <div className="card" style={{ maxWidth: '600px', margin: '20px auto 0' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          🔧 Technical Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Chain ID: </span>
            <span style={{ color: 'var(--text-primary)' }}>{chainId}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Account: </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {accounts?.[0]?.slice(0, 6)}...{accounts?.[0]?.slice(-4)}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Contract: </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>FHEVM Status: </span>
            <span style={{ color: fhevmStatus === 'ready' ? 'var(--success-green)' : 'var(--error-red)' }}>
              {fhevmStatus}
            </span>
          </div>
          {fhevmError && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>FHEVM Error: </span>
              <span style={{ color: 'var(--error-red)' }}>{fhevmError.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
