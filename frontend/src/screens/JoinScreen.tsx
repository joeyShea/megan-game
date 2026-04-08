import { useState } from 'react';

interface Props {
  onJoin: (code: string) => void;
  onBack: () => void;
}

export default function JoinScreen({ onJoin, onBack }: Props) {
  const [code, setCode] = useState('');

  return (
    <div className="screen">
      <div className="card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🔑</div>
          <h2>Join Lobby</h2>
        </div>
        <input
          className="text-input"
          style={{ width: '100%', fontSize: '2rem', letterSpacing: '10px' }}
          maxLength={4}
          placeholder="XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 4) onJoin(code); }}
          autoFocus
        />
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={code.length !== 4}
          onClick={() => onJoin(code)}
        >
          Join
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
