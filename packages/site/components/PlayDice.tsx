import { useRef, useState } from 'react';

const faces = [1, 2, 3, 4, 5, 6];

interface PlayDiceProps {
  loading: boolean;
  onPlay: (seedNumber: number, guessNumber: number) => void;
}

const PlayDice: React.FC<PlayDiceProps> = ({ loading, onPlay }) => {
  const [seed, setSeed] = useState('');
  const [guess, setGuess] = useState(1);
  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const entropyRef = useRef<string[]>([]);
  const areaRef = useRef<HTMLDivElement>(null);
  const [rolling, setRolling] = useState(false);
  const [currentFace, setCurrentFace] = useState(1);
  const [entropyReady, setEntropyReady] = useState(false);
  const [userPicked, setUserPicked] = useState(false);

  // Simple 32-bit hash of a string
  const hash32 = (str: string): number => {
    let h = 2166136261 >>> 0; // FNV-1a
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 0xffffffff;
  };

  // Start 2s mouse entropy capture
  const startEntropyCapture = () => {
    if (capturing) return;
    entropyRef.current = [];
    setCaptureProgress(0);
    setCapturing(true);
    setEntropyReady(false);

    const onMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const rect = areaRef.current?.getBoundingClientRect();
      const x = rect ? mouseEvent.clientX - rect.left : mouseEvent.clientX;
      const y = rect ? mouseEvent.clientY - rect.top : mouseEvent.clientY;
      entropyRef.current.push(`${x},${y},${mouseEvent.timeStamp}`);
    };

    const area = areaRef.current || window;
    area.addEventListener('mousemove', onMove);

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setCaptureProgress(Math.min(100, Math.round((elapsed / 2000) * 100)));
    }, 100);

    setTimeout(() => {
      area.removeEventListener('mousemove', onMove);
      clearInterval(interval);
      setCapturing(false);
      const data = entropyRef.current.join('|');
      const h = hash32(data);
      // Map to a reasonably large uint range for seed
      const seedNum = h % 1000000007; // prime mod
      setSeed(String(seedNum));
      setEntropyReady(true);
    }, 2000);
  };


  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
          🎲 Roll the Dice
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1rem',
          margin: 0
        }}>
          Choose your number or let fate decide
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <div 
          className="dice-stage" 
          onMouseEnter={() => { if (!capturing && !entropyReady) startEntropyCapture(); }}
        >
          <div
            className={`dice-cube ${rolling ? 'dice-rolling' : ''}`}
            style={{
              transform: rolling ? undefined : (
                currentFace === 1 ? 'rotateY(0deg)' :
                currentFace === 2 ? 'rotateY(-90deg)' :
                currentFace === 3 ? 'rotateY(-180deg)' :
                currentFace === 4 ? 'rotateY(90deg)' :
                currentFace === 5 ? 'rotateX(-90deg)' :
                'rotateX(90deg)'
              )
            }}
          >
            <div className="dice-face face-1">⚀</div>
            <div className="dice-face face-2">⚁</div>
            <div className="dice-face face-3">⚂</div>
            <div className="dice-face face-4">⚃</div>
            <div className="dice-face face-5">⚄</div>
            <div className="dice-face face-6">⚅</div>
          </div>
        </div>

        {/* Guess selector: click chips to choose face */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {faces.map((f) => (
            <button
              key={f}
              onClick={() => { setGuess(f); setCurrentFace(f); setUserPicked(true); }}
              className={`btn ${guess === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '12px 16px',
                fontSize: '2rem', // Increased from 1.2rem to 2rem
                minWidth: '60px'
              }}
              disabled={loading}
            >
              {['⚀','⚁','⚂','⚃','⚄','⚅'][f-1]}
            </button>
          ))}
        </div>

        {/* Entropy indicator */}
        <div style={{ 
          width: '100%', 
          maxWidth: '520px'
        }}>
          {!entropyReady && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid var(--primary-blue)',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Move your mouse to generate entropy ({captureProgress}%)</span>
            </div>
          )}
          <button
            onClick={async () => {
              // If user didn't pick, choose random face now
              const chosen = userPicked ? guess : (Math.floor(Math.random() * 6) + 1);
              if (!userPicked) {
                setGuess(chosen);
                setCurrentFace(chosen);
              }
              // ensure some extra movement during roll
              setRolling(true);
              const timer = setInterval(() => setCurrentFace(prev => (prev % 6) + 1), 50);
              await new Promise(r => setTimeout(r, 800));
              clearInterval(timer);
              setRolling(false);
              // Ensure the final face is set correctly
              setCurrentFace(chosen);
              onPlay(Number(seed || Date.now()), Number(chosen));
            }}
            disabled={loading || !entropyReady}
            className={`btn ${loading ? 'btn-loading' : 'btn-primary'}`}
            style={{ 
              width: '100%',
              height: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              opacity: loading || !entropyReady ? 0.6 : 1
            }}
          >
            {loading ? (
              'Encrypting & Playing...'
            ) : entropyReady ? (
              userPicked ? 'Roll Your Pick' : 'Roll Dice (Random)'
            ) : (
              'Move mouse to unlock'
            )}
          </button>
        </div>
      </div>

      {/* Hidden entropy capture area to track movement across the card */}
      <div ref={areaRef} style={{ width: '100%', height: 1 }} />
    </div>
  );
};

export default PlayDice;
