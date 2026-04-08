import Phaser from 'phaser';
import type { WeaponType } from '../../types';
import { MAP_WORLD_WIDTH, MAP_WORLD_HEIGHT } from '../../constants';

export interface ProjectileData {
  projectile_id: string;
  owner_id: string;
  weapon: WeaponType;
  origin_x: number;
  origin_y: number;
  direction: number;
  speed: number;
  damage: number;
  radius: number;
  bounces_remaining: number;
}

export class Projectile {
  public sprite: Phaser.GameObjects.Image;
  public data: ProjectileData;
  private vx: number;
  private vy: number;
  private bouncesLeft: number;
  public dead = false;

  constructor(scene: Phaser.Scene, data: ProjectileData) {
    this.data = data;
    this.bouncesLeft = data.bounces_remaining;

    const key = `proj_${data.weapon}`;
    this.sprite = scene.add.image(data.origin_x, data.origin_y, key);
    this.sprite.setDepth(3);

    this.vx = Math.cos(data.direction) * data.speed;
    this.vy = Math.sin(data.direction) * data.speed;
  }

  update(delta: number) {
    if (this.dead) return;
    const dt = delta / 1000;
    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;

    // Bounce off world walls
    if (this.bouncesLeft > 0) {
      if (this.sprite.x <= 32 || this.sprite.x >= MAP_WORLD_WIDTH - 32) {
        this.vx *= -1;
        this.bouncesLeft--;
      }
      if (this.sprite.y <= 32 || this.sprite.y >= MAP_WORLD_HEIGHT - 32) {
        this.vy *= -1;
        this.bouncesLeft--;
      }
    }

    // Destroy if out of bounds
    if (
      this.sprite.x < 0 || this.sprite.x > MAP_WORLD_WIDTH ||
      this.sprite.y < 0 || this.sprite.y > MAP_WORLD_HEIGHT
    ) {
      this.destroy();
    }
  }

  destroy() {
    this.dead = true;
    this.sprite.destroy();
  }

  getPos(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
