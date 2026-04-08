import type { CharacterType } from '../types';
import { CHARACTER_STATS } from '../constants';
import { wsClient } from '../network/WebSocketClient';
import CharacterSprite from './CharacterSprite';

interface Props {
  playerId: string;
  selectedCharacter: CharacterType | null;
}

const CHARS: CharacterType[] = ['miacchiato', 'americano', 'cafeaulandon', 'allanchino'];

export default function CharacterSelector({ playerId, selectedCharacter }: Props) {
  const select = (char: CharacterType) => {
    wsClient.send({ type: 'select_character', player_id: playerId, character: char });
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {CHARS.map((char) => {
        const stats = CHARACTER_STATS[char];
        const selected = selectedCharacter === char;
        return (
          <button
            key={char}
            onClick={() => select(char)}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: selected ? `3px solid #3d1c02` : '2px solid #d4a574',
              background: selected ? '#f5e6d0' : 'white',
              cursor: 'pointer',
              minWidth: 130,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              boxShadow: selected ? '0 0 0 2px #6f4e37' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <CharacterSprite character={char} size={56} />
            <strong style={{ color: '#3d1c02', fontSize: '1rem' }}>{stats.label}</strong>
            <div style={{ fontSize: '0.72rem', color: '#6f4e37', textAlign: 'center', lineHeight: 1.3 }}>
              {stats.description}
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: '0.7rem', color: '#8b4513', marginTop: 2 }}>
              <span>❤️ {stats.maxHealth}</span>
              <span>⚡ {stats.speed}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
