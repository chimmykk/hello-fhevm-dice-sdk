interface EncryptedState {
  lastDiceRoll: string;
  playerGuess: string;
  winnerStatus: string;
}

interface DecryptedState {
  lastDiceRoll: number | null;
  playerGuess: number | null;
  winnerStatus: boolean | null;
}

interface FairnessInfo {
  seed: number;
  guess: number;
  commitment: string;
  txHash: string;
}

interface DiceResultsProps {
  encrypted: EncryptedState;
  decrypted: DecryptedState;
  onDecryptRoll: () => Promise<void>;
  onDecryptGuess: () => Promise<void>;
  onDecryptWinner: () => Promise<void>;
  loading: boolean;
  fairness: FairnessInfo | null;
}

const DiceResults: React.FC<DiceResultsProps> = ({
  encrypted,
  decrypted,
  onDecryptRoll,
  onDecryptGuess,
  onDecryptWinner,
  loading,
  fairness
}) => {
  const handleDecryptAll = async () => {
    try {
      await onDecryptRoll();
      await onDecryptGuess();
      await onDecryptWinner();
    } catch {
      // swallow; individual handlers already toast errors
    }
  };
  return (
    <div className="card" style={{ maxWidth: '90rem', margin: '6.6px auto 0' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          color: 'var(--text-primary)', 
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          🔐 Encrypted Results
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem',
          margin: 0
        }}>
          Decrypt your results to see the outcome
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ 
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎲 Last Dice Roll (encrypted)
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                wordBreak: 'break-all',
                lineHeight: '1.4'
              }}>
                {encrypted.lastDiceRoll}
              </div>
              {decrypted.lastDiceRoll != null && (
                <div style={{ 
                  marginTop: '10px',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'var(--success-green)',
                  color: 'var(--text-white)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}>
                  ➡️ {decrypted.lastDiceRoll}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={onDecryptRoll}
                disabled={loading}
                className={`btn ${loading ? 'btn-loading' : 'btn-secondary'}`}
                style={{ 
                  fontSize: '0.9rem',
                  padding: '10px 20px',
                  minWidth: '120px'
                }}
              >
                🔓 Decrypt
              </button>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Your Guess (encrypted)
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                wordBreak: 'break-all',
                lineHeight: '1.4'
              }}>
                {encrypted.playerGuess}
              </div>
              {decrypted.playerGuess != null && (
                <div style={{ 
                  marginTop: '10px',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'var(--success-green)',
                  color: 'var(--text-white)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}>
                  ➡️ {decrypted.playerGuess}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={onDecryptGuess}
                disabled={loading}
                className={`btn ${loading ? 'btn-loading' : 'btn-secondary'}`}
                style={{ 
                  fontSize: '0.9rem',
                  padding: '10px 20px',
                  minWidth: '120px'
                }}
              >
                🔓 Decrypt
              </button>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏆 Winner Status (encrypted)
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                wordBreak: 'break-all',
                lineHeight: '1.4'
              }}>
                {encrypted.winnerStatus}
              </div>
              {decrypted.winnerStatus != null && (
                <div style={{ 
                  marginTop: '10px',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: decrypted.winnerStatus ? 'var(--success-green)' : 'var(--error-red)',
                  color: 'var(--text-white)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}>
                  ➡️ {decrypted.winnerStatus ? '🎉 Winner!' : '❌ Not winner'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={onDecryptWinner}
                disabled={loading}
                className={`btn ${loading ? 'btn-loading' : 'btn-secondary'}`}
                style={{ 
                  fontSize: '0.9rem',
                  padding: '10px 20px',
                  minWidth: '120px'
                }}
              >
                🔓 Decrypt
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            onClick={handleDecryptAll}
            disabled={loading}
            className={`btn ${loading ? 'btn-loading' : 'btn-primary'}`}
            style={{ minWidth: '160px', height: '40px', fontSize: '0.95rem', fontWeight: 600 }}
          >
            {loading ? 'Decrypting...' : 'Decrypt All'}
          </button>
        </div>
      </div>
      
      {fairness && (
        <div style={{ 
          padding: '16px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>✅ Fairness Proof</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Seed used: <span style={{ color: 'var(--text-primary)' }}>{fairness.seed}</span> • Guess: <span style={{ color: 'var(--text-primary)' }}>{fairness.guess}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-card)', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', wordBreak: 'break-all', marginBottom: '8px' }}>
            commitment (sha256(seed)) = {fairness.commitment}
          </div>
          {fairness.txHash && (
            <a href={`https://sepolia.etherscan.io/tx/${fairness.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem' }}>
              View transaction ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceResults;
