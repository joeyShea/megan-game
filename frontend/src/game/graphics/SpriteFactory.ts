import Phaser from 'phaser';
import { WEAPON_STATS, MAP_TILE_SIZE } from '../../constants';
import type { WeaponType } from '../../types';

/**
 * Generates all game textures programmatically using Phaser Graphics.
 * Character sprites are loaded as PNGs in BootScene.preload() instead.
 */
export class SpriteFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll() {
    this.genProjectiles();
    this.genTiles();
    this.genPickup();
    this.genHealthBar();
    this.genObstacle();
  }

  private draw(key: string, w: number, h: number, fn: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.scene.add.graphics();
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private genProjectiles() {
    // Coffee bean
    this.draw('proj_coffee_bean', 10, 8, (g) => {
      g.fillStyle(WEAPON_STATS['coffee_bean'].color, 1);
      g.fillEllipse(5, 4, 10, 7);
      g.lineStyle(1, 0x1a0a00, 0.6);
      g.strokeEllipse(5, 4, 10, 7);
    });

    // Steam blast
    this.draw('proj_steam_blast', 20, 20, (g) => {
      g.fillStyle(0xcccccc, 0.8);
      g.fillCircle(10, 10, 9);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(7, 7, 4);
    });

    // Milk frother
    this.draw('proj_milk_frother', 10, 10, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(5, 5, 5);
      g.lineStyle(1.5, 0xcccccc, 0.8);
      g.strokeCircle(5, 5, 5);
    });

    // Steam blast AoE indicator
    this.draw('aoe_steam_blast', 160, 160, (g) => {
      g.fillStyle(0xcccccc, 0.15);
      g.fillCircle(80, 80, 80);
      g.lineStyle(2, 0xaaaaaa, 0.4);
      g.strokeCircle(80, 80, 80);
    });
  }

  private genTiles() {
    const T = MAP_TILE_SIZE;

    // Floor tile
    this.draw('tile_floor', T, T, (g) => {
      g.fillStyle(0xf0e4cc, 1);
      g.fillRect(0, 0, T, T);
      g.lineStyle(0.5, 0xddd0b8, 0.5);
      g.strokeRect(0, 0, T, T);
    });

    // Decor tile (coffee bean scatter)
    this.draw('tile_decor', T, T, (g) => {
      g.fillStyle(0xf0e4cc, 1);
      g.fillRect(0, 0, T, T);
      g.lineStyle(0.5, 0xddd0b8, 0.5);
      g.strokeRect(0, 0, T, T);
      // Small coffee bean
      g.fillStyle(0x6f4e37, 0.35);
      g.fillEllipse(T / 2, T / 2, 8, 6);
      g.lineStyle(0.5, 0x3d1c02, 0.2);
      g.lineBetween(T / 2 - 3, T / 2, T / 2 + 3, T / 2);
    });

    // Wall tile
    this.draw('tile_wall', T, T, (g) => {
      g.fillStyle(0x8b6347, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5438, 1);
      g.fillRect(2, 2, T - 4, T - 4);
      g.lineStyle(1, 0x5a3d28, 0.6);
      g.strokeRect(2, 2, T - 4, T - 4);
    });
  }

  private genPickup() {
    const WEAPONS: WeaponType[] = ['coffee_bean', 'steam_blast', 'milk_frother'];
    for (const w of WEAPONS) {
      this.draw(`pickup_${w}`, 24, 24, (g) => {
        g.fillStyle(WEAPON_STATS[w].color, 0.9);
        g.fillCircle(12, 12, 11);
        g.lineStyle(2, 0xffffff, 0.7);
        g.strokeCircle(12, 12, 11);
      });
    }
  }

  private genObstacle() {
    const S = 36;
    this.draw('obstacle', S, S, (g) => {
      // Dark espresso base
      g.fillStyle(0x2e1a0e, 1);
      g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
      // Inner coffee ring highlight
      g.lineStyle(2, 0x7a5438, 0.7);
      g.strokeRoundedRect(5, 5, S - 10, S - 10, 4);
      // Small coffee bean in center
      g.fillStyle(0x6f4e37, 0.9);
      g.fillEllipse(S / 2, S / 2, 14, 10);
      g.lineStyle(1, 0x1a0a00, 0.8);
      g.lineBetween(S / 2 - 5, S / 2, S / 2 + 5, S / 2);
    });
  }

  private genHealthBar() {
    const W = 80, H = 8;
    this.draw('hpbar_bg', W, H, (g) => {
      g.fillStyle(0x1a1a1a, 0.75);
      g.fillRoundedRect(0, 0, W, H, 4);
    });
    this.draw('hpbar_fill', W, H, (g) => {
      g.fillStyle(0x4ade80, 1);
      g.fillRoundedRect(0, 0, W, H, 4);
    });
    this.draw('hpbar_fill_mid', W, H, (g) => {
      g.fillStyle(0xfbbf24, 1);
      g.fillRoundedRect(0, 0, W, H, 4);
    });
    this.draw('hpbar_fill_low', W, H, (g) => {
      g.fillStyle(0xf87171, 1);
      g.fillRoundedRect(0, 0, W, H, 4);
    });
  }
}
