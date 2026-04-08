import type { CharacterType } from '../types';
import { CHARACTER_STATS } from '../constants';

interface Props {
  character: CharacterType;
  size?: number;
}

export default function CharacterSprite({ character, size = 48 }: Props) {
  const stats = CHARACTER_STATS[character];
  return (
    <img
      src={stats.sprite}
      alt={stats.label}
      width={size}
      height={size}
      style={{ imageRendering: 'auto', objectFit: 'contain', display: 'block' }}
    />
  );
}
