import type { PlayerInfo, CharacterType } from '../types';
import { CHARACTER_STATS } from '../constants';
import CharacterSprite from './CharacterSprite';

interface Props {
  player: PlayerInfo;
  isMe: boolean;
}

export default function PlayerCard({ player, isMe }: Props) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 16px', borderRadius: 10,
        background: isMe ? '#fdf6e3' : 'white',
        border: isMe ? '2px solid #6f4e37' : '1px solid #d4a574',
        minWidth: 240,
      }}
    >
      {player.character ? (
        <CharacterSprite character={player.character as CharacterType} size={40} />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#e8e0d8', border: '2px dashed #d4a574',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', color: '#b0a090',
        }}>?</div>
      )}
      <div>
        <div style={{ fontWeight: 'bold', color: '#3d1c02', fontSize: '0.95rem' }}>
          {player.display_name}{isMe ? ' (you)' : ''}{player.is_host ? ' 👑' : ''}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6f4e37' }}>
          {player.character
            ? CHARACTER_STATS[player.character as CharacterType]?.label ?? player.character
            : 'Choosing…'}
        </div>
      </div>
      {player.is_ready && (
        <div style={{ marginLeft: 'auto', color: '#7dba84', fontWeight: 'bold', fontSize: '0.85rem' }}>
          ✓ Ready
        </div>
      )}
    </div>
  );
}
