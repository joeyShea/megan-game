import type { GameOverData, PlayerInfo, CharacterType } from '../types';
import { CHARACTER_STATS } from '../constants';
import CharacterSprite from '../components/CharacterSprite';

interface Props {
  gameOverData: GameOverData;
  players: PlayerInfo[];
  onPlayAgain: () => void;
}

export default function WinScreen({ gameOverData, players, onPlayAgain }: Props) {
  const { winner_id, placements } = gameOverData;
  const playerMap = Object.fromEntries(players.map((p) => [p.player_id, p]));
  const winner = playerMap[winner_id];

  const losers = placements
    .filter((id) => id !== winner_id)
    .map((id) => playerMap[id])
    .filter(Boolean);

  return (
    <div className="screen" style={{ background: 'linear-gradient(160deg, #fdf6e3 60%, #f5e6d0)', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#6f4e37', marginBottom: 4 }}>Winner!</div>
        <h1 style={{ fontSize: '3rem', marginBottom: 8 }}>☕ {winner?.display_name ?? 'Unknown'}</h1>
        {winner?.character && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CharacterSprite character={winner.character as CharacterType} size={120} />
            <div style={{ fontSize: '1rem', color: '#6f4e37' }}>
              {CHARACTER_STATS[winner.character as CharacterType]?.label}
            </div>
          </div>
        )}
      </div>

      {losers.length > 0 && (
        <div>
          <div style={{ textAlign: 'center', color: '#8b4513', fontSize: '0.85rem', marginBottom: 10 }}>
            Defeated
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-end' }}>
            {losers.map((p, i) => (
              <div key={p.player_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.65 }}>
                <CharacterSprite character={p.character as CharacterType} size={48} />
                <div style={{ fontSize: '0.75rem', color: '#6f4e37', textAlign: 'center' }}>
                  #{i + 2} {p.display_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 48px' }} onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}
