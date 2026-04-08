import { useEffect, useState } from 'react';
import type { WeaponType, CharacterType } from '../types';
import { WEAPON_STATS, CHARACTER_STATS } from '../constants';

interface Props {
  playerId: string;
  character: CharacterType | null;
}

export default function HUD({ playerId, character }: Props) {
  const [weapon, setWeapon] = useState<WeaponType>('coffee_bean');
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);

  useEffect(() => {
    const onWeapon = (e: CustomEvent) => {
      if (e.detail?.playerId === playerId) setWeapon(e.detail.weapon);
    };
    const onHealth = (e: CustomEvent) => {
      setHealth(e.detail.health);
      setMaxHealth(e.detail.maxHealth);
    };
    window.addEventListener('weaponChanged', onWeapon as EventListener);
    window.addEventListener('healthChanged', onHealth as EventListener);
    return () => {
      window.removeEventListener('weaponChanged', onWeapon as EventListener);
      window.removeEventListener('healthChanged', onHealth as EventListener);
    };
  }, [playerId]);

  // Seed maxHealth from CHARACTER_STATS on mount
  useEffect(() => {
    if (character) {
      const mh = CHARACTER_STATS[character].maxHealth;
      setMaxHealth(mh);
      setHealth(mh);
    }
  }, [character]);

  const pct = Math.max(0, Math.min(1, health / maxHealth));
  const barColor = pct < 0.3 ? '#f87171' : pct < 0.6 ? '#fbbf24' : '#4ade80';
  const weaponStats = WEAPON_STATS[weapon];
  const charStats = character ? CHARACTER_STATS[character] : null;

  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 24,
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(20, 10, 4, 0.72)',
      backdropFilter: 'blur(12px)',
      borderRadius: 18,
      padding: '12px 18px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
      minWidth: 220,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* Character portrait */}
      {charStats && (
        <img
          src={charStats.sprite}
          alt={charStats.label}
          width={52}
          height={52}
          style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0, objectFit: 'contain' }}
        />
      )}

      {/* Right column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Name + HP number */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: '#fdf6e3', fontSize: '0.8rem', fontFamily: 'Georgia, serif', letterSpacing: 0.5 }}>
            {charStats?.label ?? 'Player'}
          </span>
          <span style={{ color: barColor, fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace', transition: 'color 0.3s' }}>
            {Math.ceil(health)}<span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>/{maxHealth}</span>
          </span>
        </div>

        {/* Health bar */}
        <div style={{
          height: 8, borderRadius: 4,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: barColor,
            borderRadius: 4,
            transition: 'width 0.18s ease-out, background 0.3s ease',
            boxShadow: `0 0 8px ${barColor}88`,
          }} />
        </div>

        {/* Weapon */}
        <div style={{
          color: 'rgba(253,246,227,0.5)',
          fontSize: '0.72rem',
          fontFamily: 'Georgia, serif',
          letterSpacing: 0.3,
        }}>
          ☕ {weaponStats.label}
        </div>
      </div>
    </div>
  );
}
