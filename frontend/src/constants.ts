import type { CharacterType, WeaponType } from './types';

export const MAP_TILE_SIZE = 32;
export const MAP_TILES_WIDE = 50;
export const MAP_TILES_TALL = 50;
export const MAP_WORLD_WIDTH = MAP_TILE_SIZE * MAP_TILES_WIDE;   // 1600
export const MAP_WORLD_HEIGHT = MAP_TILE_SIZE * MAP_TILES_TALL;  // 1600

export const NETWORK_TICK_MS = 50;  // 20Hz send rate
export const LERP_FACTOR = 0.2;

export interface CharacterStats {
  maxHealth: number;
  speed: number;
  damageMultiplier: number;
  color: number;
  label: string;
  playerName: string;
  description: string;
  sprite: string;  // path to PNG in /public
}

export const CHARACTER_STATS: Record<CharacterType, CharacterStats> = {
  miacchiato: {
    maxHealth: 80,
    speed: 220,
    damageMultiplier: 1.4,
    color: 0x8b4513,
    label: 'Mia-cchiato',
    playerName: 'Mia',
    description: 'Fast & fierce. Low HP, high damage.',
    sprite: '/Macchiato.png',
  },
  americano: {
    maxHealth: 100,
    speed: 160,
    damageMultiplier: 1.0,
    color: 0x2d5a27,
    label: 'Amir-icano',
    playerName: 'Amir',
    description: 'Smooth & balanced. All-rounder.',
    sprite: '/Americano.png',
  },
  cafeaulandon: {
    maxHealth: 100,
    speed: 150,
    damageMultiplier: 1.0,
    color: 0xd4a574,
    label: 'Café Au Landon',
    playerName: 'Landen',
    description: 'Smooth & wide. 3-way spread shot.',
    sprite: '/cafe.png',
  },
  allanchino: {
    maxHealth: 120,
    speed: 110,
    damageMultiplier: 0.75,
    color: 0x4a7c59,
    label: 'Allanchino',
    playerName: 'Allan',
    description: 'Thick & tough. High HP, slow.',
    sprite: '/cappuchino.png',
  },
};

export interface WeaponStats {
  speed: number;
  damage: number;
  radius: number;
  bounces: number;
  color: number;
  label: string;
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  coffee_bean:  { speed: 480, damage: 6,  radius: 0,  bounces: 0, color: 0x3d1c02, label: 'Coffee Bean'  },
  steam_blast:  { speed: 180, damage: 16, radius: 80, bounces: 0, color: 0xe8e8e8, label: 'Steam Blast'  },
  milk_frother: { speed: 300, damage: 9,  radius: 0,  bounces: 3, color: 0xffffff, label: 'Milk Frother' },
};

export const WEAPONS: WeaponType[] = ['coffee_bean', 'steam_blast', 'milk_frother'];

export const SPAWN_POINTS = [
  { x: 96,   y: 96   },
  { x: 1504, y: 96   },
  { x: 96,   y: 1504 },
  { x: 1504, y: 1504 },
];

// Weapon pickup positions (center area)
export const WEAPON_PICKUPS = [
  { x: 800, y: 400,  weapon: 'steam_blast'  as WeaponType },
  { x: 400, y: 800,  weapon: 'milk_frother' as WeaponType },
  { x: 1200, y: 800, weapon: 'milk_frother' as WeaponType },
  { x: 800, y: 1200, weapon: 'steam_blast'  as WeaponType },
];
