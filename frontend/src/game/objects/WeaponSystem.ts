import type { WeaponType } from '../../types';
import { WEAPONS, WEAPON_STATS } from '../../constants';

export class WeaponSystem {
  private current: WeaponType = 'coffee_bean';
  private cooldowns: Map<WeaponType, number> = new Map();
  private readonly cooldownMs: Record<WeaponType, number> = {
    coffee_bean:  300,
    steam_blast:  1200,
    milk_frother: 600,
  };

  getWeapon(): WeaponType { return this.current; }

  setWeapon(w: WeaponType) { this.current = w; }

  cycleWeapon() {
    const idx = WEAPONS.indexOf(this.current);
    this.current = WEAPONS[(idx + 1) % WEAPONS.length];
  }

  canFire(time: number): boolean {
    const last = this.cooldowns.get(this.current) ?? 0;
    return time - last >= this.cooldownMs[this.current];
  }

  fire(time: number) {
    this.cooldowns.set(this.current, time);
  }

  getStats() { return WEAPON_STATS[this.current]; }
}
