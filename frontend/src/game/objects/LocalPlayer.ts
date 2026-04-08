import Phaser from 'phaser';
import type { CharacterType } from '../../types';
import { CHARACTER_STATS, NETWORK_TICK_MS } from '../../constants';
import { WeaponSystem } from './WeaponSystem';

export class LocalPlayer {
  public sprite: Phaser.Physics.Arcade.Image;
  public health: number;
  public maxHealth: number;
  public alive = true;
  public character: CharacterType;
  public weaponSystem: WeaponSystem;
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

    const stats = CHARACTER_STATS[character];
    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;

    this.sprite = scene.physics.add.image(x, y, `char_${character}`);
    this.sprite.setDisplaySize(36, 36);
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);

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

  update(time: number, _delta: number) {
    if (!this.alive) return;

    const stats = CHARACTER_STATS[this.character];
    const speed = stats.speed;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    let vx = 0, vy = 0;
    if (this.keys.left.isDown  || this.keys.a.isDown) vx -= speed;
    if (this.keys.right.isDown || this.keys.d.isDown) vx += speed;
    if (this.keys.up.isDown    || this.keys.w.isDown) vy -= speed;
    if (this.keys.down.isDown  || this.keys.s.isDown) vy += speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707; vy *= 0.707;
    }

    body.setVelocity(vx, vy);

    // Rotate sprite to face movement direction
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
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
  }

  getPos() { return { x: this.sprite.x, y: this.sprite.y }; }
}
