import type { PlayerInfo, CharacterType } from '../types';
import { wsClient } from '../network/WebSocketClient';
import PlayerCard from '../components/PlayerCard';
import CharacterSelector from '../components/CharacterSelector';

interface Props {
  lobbyCode: string;
  playerId: string;
  players: PlayerInfo[];
}

export default function LobbyScreen({ lobbyCode, playerId, players }: Props) {
  const me = players.find((p) => p.player_id === playerId);
  const isHost = me?.is_host ?? false;
  const allReady = players.length >= 2 && players.every((p) => p.character !== null);

  const startGame = () => wsClient.send({ type: 'host_start_game', player_id: playerId });

  return (
    <div className="screen" style={{ gap: 20, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#6f4e37', marginBottom: 4 }}>Share this code</div>
        <div className="lobby-code-badge">{lobbyCode}</div>
        <div className="subtitle" style={{ marginTop: 6 }}>Waiting for players… ({players.length}/4)</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map((p) => (
          <PlayerCard key={p.player_id} player={p} isMe={p.player_id === playerId} />
        ))}
        {Array.from({ length: 4 - players.length }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 16px', borderRadius: 10, minWidth: 240,
            border: '1px dashed #d4a574', color: '#c0b0a0', fontSize: '0.9rem',
          }}>
            Empty slot
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: 12 }}>Choose your character</h3>
        <CharacterSelector playerId={playerId} selectedCharacter={me?.character as CharacterType | null} />
      </div>

      {isHost && (
        <button
          className="btn btn-success"
          style={{ minWidth: 200, fontSize: '1.1rem' }}
          disabled={!allReady}
          onClick={startGame}
          title={!allReady ? 'All players must select a character first' : ''}
        >
          ☕ Start Game
        </button>
      )}
      {!isHost && (
        <p className="subtitle">Waiting for host to start…</p>
      )}
      {!allReady && players.length < 2 && (
        <p className="subtitle" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Need at least 2 players to start</p>
      )}
    </div>
  );
}
