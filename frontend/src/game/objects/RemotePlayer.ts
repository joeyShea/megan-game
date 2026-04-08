import Phaser from 'phaser';
import type { CharacterType } from '../../types';
import { LERP_FACTOR } from '../../constants';

export class RemotePlayer {
  public sprite: Phaser.GameObjects.Image;
  public health: number;
  public maxHealth: number;
  public alive = true;
  public character: CharacterType;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterType, maxHealth: number) {
    this.character = character;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.targetX = x;
    this.targetY = y;

    this.sprite = scene.add.image(x, y, `char_${character}`);
    this.sprite.setDisplaySize(144, 144);
    this.sprite.setDepth(4);
  }

  update() {
    if (!this.alive) return;
    // Lerp toward server position
    this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, LERP_FACTOR);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, LERP_FACTOR);
  }

  setTarget(x: number, y: number, direction: number) {
    this.targetX = x;
    this.targetY = y;
    if (Math.abs(x - this.sprite.x) > 1 || Math.abs(y - this.sprite.y) > 1) {
      this.sprite.setRotation(direction);
    }
  }

  applyHealth(newHealth: number) {
    this.health = newHealth;
  }

  die() {
    this.alive = false;
    this.sprite.setTint(0x888888);
    this.sprite.setAlpha(0.55);
    this.sprite.setRotation(0);
  }

  destroy() {
    this.sprite.destroy();
  }

  getPos() { return { x: this.sprite.x, y: this.sprite.y }; }
}
