import { useEffect, useState } from 'react';
import type { WeaponType } from '../types';
import { WEAPON_STATS } from '../constants';

interface Props {
  playerId: string;
}

export default function HUD({ playerId }: Props) {
  const [weapon, setWeapon] = useState<WeaponType>('coffee_bean');

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.playerId === playerId) setWeapon(e.detail.weapon);
    };
    window.addEventListener('weaponChanged', handler as EventListener);
    return () => window.removeEventListener('weaponChanged', handler as EventListener);
  }, [playerId]);

  const stats = WEAPON_STATS[weapon];

  return (
    <div className="hud-overlay">
      <div className="weapon-label">{stats.label}</div>
    </div>
  );
}
