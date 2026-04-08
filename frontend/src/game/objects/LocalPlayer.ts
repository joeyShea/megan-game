import Phaser from 'phaser';
import type { CharacterType } from '../../types';
import { CHARACTER_STATS, NETWORK_TICK_MS, MAP_WORLD_WIDTH, MAP_WORLD_HEIGHT } from '../../constants';
import { WeaponSystem } from './WeaponSystem';

// Keeps the player inside the playable area (half sprite display size)
const WALL_MARGIN = 72;

export class LocalPlayer {
  public sprite: Phaser.GameObjects.Image;
  public health: number;
  public maxHealth: number;
  public alive = true;
  public stunned = false;
  public character: CharacterType;
  public weaponSystem: WeaponSystem;
  private scene: Phaser.Scene;
  private playerId: string;
  private onFireWeapon: (ws: WeaponSystem) => void;
  private onStateUpdate: (state: object) => void;
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    cycleWeapon: Phaser.Input.Keyboard.Key;
  };
  private lastSent = 0;
  private sequence = 0;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    playerId: string,
    character: CharacterType,
    onFireWeapon: (ws: WeaponSystem) => void,
    onStateUpdate: (state: object) => void,
  ) {
    this.playerId = playerId;
    this.character = character;
    this.weaponSystem = new WeaponSystem();
    this.onFireWeapon = onFireWeapon;
    this.onStateUpdate = onStateUpdate;

    this.scene = scene;
    const stats = CHARACTER_STATS[character];
    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;

    // Plain image — no Arcade Physics (avoids Phaser 3.87 ArcadeBody init bug)
    this.sprite = scene.add.image(x, y, `char_${character}`);
    this.sprite.setDisplaySize(144, 144);
    this.sprite.setDepth(5);

    const kb = scene.input.keyboard!;
    this.keys = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      fire:        kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      cycleWeapon: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    };
  }

  /** Hit an obstacle — freeze movement and spin 360°. */
  stun() {
    if (this.stunned || !this.alive) return;
    this.stunned = true;
    const fullSpin = this.sprite.rotation + Math.PI * 2;
    this.scene.tweens.add({
      targets: this.sprite,
      rotation: fullSpin,
      duration: 650,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.stunned = false;
      },
    });
  }

  /** Flash sprite red briefly to indicate damage received. */
  flashDamage() {
    if (!this.alive) return;
    this.sprite.setTint(0xff2222);
    this.scene.time.delayedCall(160, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
  }

  update(time: number, delta: number) {
    if (!this.alive) return;
    if (this.stunned) return;

    const dt = delta / 1000;
    const stats = CHARACTER_STATS[this.character];
    const speed = stats.speed;

    let vx = 0, vy = 0;
    if (this.keys.left.isDown  || this.keys.a.isDown) vx -= speed;
    if (this.keys.right.isDown || this.keys.d.isDown) vx += speed;
    if (this.keys.up.isDown    || this.keys.w.isDown) vy -= speed;
    if (this.keys.down.isDown  || this.keys.s.isDown) vy += speed;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707; vy *= 0.707;
    }

    // Apply movement + clamp to world bounds
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x + vx * dt, WALL_MARGIN, MAP_WORLD_WIDTH  - WALL_MARGIN);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y + vy * dt, WALL_MARGIN, MAP_WORLD_HEIGHT - WALL_MARGIN);

    // Rotate to face movement direction
    if (vx !== 0 || vy !== 0) {
      this.sprite.setRotation(Math.atan2(vy, vx));
    }

    // Cycle weapon
    if (Phaser.Input.Keyboard.JustDown(this.keys.cycleWeapon)) {
      this.weaponSystem.cycleWeapon();
      window.dispatchEvent(new CustomEvent('weaponChanged', {
        detail: { playerId: this.playerId, weapon: this.weaponSystem.getWeapon() },
      }));
    }

    // Fire
    if (this.keys.fire.isDown && this.weaponSystem.canFire(time)) {
      this.weaponSystem.fire(time);
      this.onFireWeapon(this.weaponSystem);
    }

    // Send state to server at network tick rate
    if (time - this.lastSent >= NETWORK_TICK_MS) {
      this.lastSent = time;
      this.sequence++;
      this.onStateUpdate({
        type: 'player_state',
        player_id: this.playerId,
        x: this.sprite.x,
        y: this.sprite.y,
        velocity_x: vx,
        velocity_y: vy,
        direction: this.sprite.rotation,
        animation_state: (vx !== 0 || vy !== 0) ? 'walk' : 'idle',
        sequence: this.sequence,
      });
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

  getPos() { return { x: this.sprite.x, y: this.sprite.y }; }
}
