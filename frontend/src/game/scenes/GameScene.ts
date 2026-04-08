import Phaser from 'phaser';
import { wsClient } from '../../network/WebSocketClient';
import type { WSMessage, CharacterType, PlayerInfo } from '../../types';
import { LocalPlayer } from '../objects/LocalPlayer';
import { RemotePlayer } from '../objects/RemotePlayer';
import { Projectile } from '../objects/Projectile';
import type { ProjectileData } from '../objects/Projectile';
import { CHARACTER_STATS, MAP_TILE_SIZE, MAP_TILES_WIDE, MAP_TILES_TALL, SPAWN_POINTS, WEAPON_PICKUPS } from '../../constants';
import { WeaponSystem } from '../objects/WeaponSystem';

const MAP_W = MAP_TILE_SIZE * MAP_TILES_WIDE;
const MAP_H = MAP_TILE_SIZE * MAP_TILES_TALL;

// Seeded pseudo-random for deterministic decor tile layout
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return function () {
    h = (Math.imul(16807, h)) | 0;
    return ((h >>> 0) / 4294967296);
  };
}

export class GameScene extends Phaser.Scene {
  private localPlayer: LocalPlayer | null = null;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private projectiles: Map<string, Projectile> = new Map();
  private playerId = '';
  private playerList: PlayerInfo[] = [];
  private displayNames: Map<string, string> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { playerId: string; players: PlayerInfo[] }) {
    this.playerId = data.playerId;
    this.playerList = data.players ?? [];
  }

  create() {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setZoom(1);

    this.buildMap();
    this.spawnPlayers();
    this.buildWeaponPickups();

    // Camera follows local player
    if (this.localPlayer) {
      this.cameras.main.startFollow(this.localPlayer.sprite, true, 0.08, 0.08);
    }

    // Start parallel UI scene
    this.scene.launch('UIScene');

    // Register players in UI
    this.playerList.forEach((p) => {
      const stats = CHARACTER_STATS[p.character as CharacterType];
      this.displayNames.set(p.player_id, p.display_name);
      this.game.events.emit('register_player', {
        playerId: p.player_id,
        displayName: p.display_name,
        maxHealth: stats?.maxHealth ?? 100,
      });
    });
  }

  private buildMap() {
    const lobbyCode = (this.game.registry.get('lobbyCode') as string) ?? 'AAAA';
    const rng = seededRng(lobbyCode);
    const DECOR_CHANCE = 0.06;

    for (let row = 0; row < MAP_TILES_TALL; row++) {
      for (let col = 0; col < MAP_TILES_WIDE; col++) {
        const x = col * MAP_TILE_SIZE + MAP_TILE_SIZE / 2;
        const y = row * MAP_TILE_SIZE + MAP_TILE_SIZE / 2;
        const isWall = row === 0 || row === MAP_TILES_TALL - 1 || col === 0 || col === MAP_TILES_WIDE - 1;
        if (isWall) {
          this.add.image(x, y, 'tile_wall').setDepth(0);
        } else {
          const isDecor = rng() < DECOR_CHANCE;
          this.add.image(x, y, isDecor ? 'tile_decor' : 'tile_floor').setDepth(0);
        }
      }
    }
  }

  private spawnPlayers() {
    let spawnIdx = 0;
    for (const p of this.playerList) {
      if (!p.character) continue;
      const spawn = SPAWN_POINTS[spawnIdx % SPAWN_POINTS.length];
      spawnIdx++;

      if (p.player_id === this.playerId) {
        this.localPlayer = new LocalPlayer(
          this,
          spawn.x, spawn.y,
          p.player_id,
          p.character as CharacterType,
          (ws) => this.fireWeapon(ws),
          (state) => wsClient.send(state),
        );
      } else {
        const stats = CHARACTER_STATS[p.character as CharacterType];
        const remote = new RemotePlayer(this, spawn.x, spawn.y, p.character as CharacterType, stats.maxHealth);
        this.remotePlayers.set(p.player_id, remote);
      }
    }
  }

  private buildWeaponPickups() {
    for (const wp of WEAPON_PICKUPS) {
      const icon = this.add.image(wp.x, wp.y, `pickup_${wp.weapon}`)
        .setDepth(2)
        .setInteractive();

      // Pulse animation
      this.tweens.add({
        targets: icon,
        scaleX: 1.2, scaleY: 1.2,
        yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut',
      });

      // Pickup detection — check in update loop
      (icon as any)._weapon = wp.weapon;
      (icon as any)._active = true;
    }
  }

  private fireWeapon(ws: WeaponSystem) {
    if (!this.localPlayer) return;
    const { x, y } = this.localPlayer.getPos();
    const dir = this.localPlayer.sprite.rotation;
    wsClient.send({
      type: 'fire_weapon',
      player_id: this.playerId,
      weapon: ws.getWeapon(),
      origin_x: x,
      origin_y: y,
      direction: dir,
      sequence: 0,
    });
  }

  update(_time: number, delta: number) {
    // Process WS messages first (safe, synchronous)
    const msgs = wsClient.flushQueue();
    for (const msg of msgs) this.handleMessage(msg);

    // Update local player
    this.localPlayer?.update(_time, delta);

    // Update remote players
    this.remotePlayers.forEach((rp) => rp.update());

    // Update projectiles
    this.projectiles.forEach((proj, id) => {
      if (proj.dead) { this.projectiles.delete(id); return; }
      proj.update(delta);
      // Hit detection for projectiles NOT owned by this player against local player
      if (!this.localPlayer?.alive) return;
      if (proj.data.owner_id !== this.playerId) {
        const { x, y } = proj.getPos();
        const lp = this.localPlayer!;
        const dist = Phaser.Math.Distance.Between(x, y, lp.sprite.x, lp.sprite.y);
        const hitRadius = proj.data.radius > 0 ? proj.data.radius : 55;
        if (dist < hitRadius) {
          wsClient.send({
            type: 'hit_detected',
            shooter_id: proj.data.owner_id,
            target_id: this.playerId,
            projectile_id: proj.data.projectile_id,
            weapon: proj.data.weapon,
          });
          proj.destroy();
          this.projectiles.delete(proj.data.projectile_id);
        }
      }
    });

    // Weapon pickup detection
    this.checkWeaponPickups();
  }

  private checkWeaponPickups() {
    if (!this.localPlayer?.alive) return;
    const lp = this.localPlayer!;
    this.children.list.forEach((child: any) => {
      if (child._weapon && child._active) {
        const dist = Phaser.Math.Distance.Between(child.x, child.y, lp.sprite.x, lp.sprite.y);
        if (dist < 80) {
          child._active = false;
          child.setVisible(false);
          lp.weaponSystem.setWeapon(child._weapon);
          window.dispatchEvent(new CustomEvent('weaponChanged', {
            detail: { playerId: this.playerId, weapon: child._weapon },
          }));
          // Respawn after 10 seconds
          this.time.delayedCall(10000, () => {
            child._active = true;
            child.setVisible(true);
          });
        }
      }
    });
  }

  private handleMessage(msg: WSMessage) {
    switch (msg.type) {
      case 'world_state':
        this.handleWorldState(msg);
        break;
      case 'projectile_spawned':
        this.handleProjectileSpawned(msg);
        break;
      case 'hit_registered':
        this.handleHitRegistered(msg);
        break;
      case 'player_died':
        this.handlePlayerDied(msg);
        break;
    }
  }

  private handleWorldState(msg: any) {
    for (const ps of (msg.players ?? [])) {
      if (ps.player_id === this.playerId) {
        if (this.localPlayer) {
          this.localPlayer.applyHealth(ps.health);
          this.game.events.emit('health_update', { playerId: ps.player_id, health: ps.health });
          window.dispatchEvent(new CustomEvent('healthChanged', {
            detail: { health: ps.health, maxHealth: this.localPlayer!.maxHealth },
          }));
        }
        continue;
      }
      const rp = this.remotePlayers.get(ps.player_id);
      if (rp) {
        rp.setTarget(ps.x, ps.y, ps.direction);
        rp.applyHealth(ps.health);
        this.game.events.emit('health_update', { playerId: ps.player_id, health: ps.health });
      }
    }
  }

  private handleProjectileSpawned(msg: any) {
    const data: ProjectileData = {
      projectile_id: msg.projectile_id,
      owner_id: msg.owner_id,
      weapon: msg.weapon,
      origin_x: msg.origin_x,
      origin_y: msg.origin_y,
      direction: msg.direction,
      speed: msg.speed,
      damage: msg.damage,
      radius: msg.radius,
      bounces_remaining: msg.bounces_remaining,
    };
    const proj = new Projectile(this, data);
    this.projectiles.set(data.projectile_id, proj);

    // Destroy projectile after travel time (generous timeout)
    const maxTravelMs = 4000;
    this.time.delayedCall(maxTravelMs, () => {
      if (!proj.dead) proj.destroy();
      this.projectiles.delete(data.projectile_id);
    });
  }

  private handleHitRegistered(msg: any) {
    const proj = this.projectiles.get(msg.projectile_id);
    if (proj) {
      this.showHitFlash(proj.getPos().x, proj.getPos().y);
      proj.destroy();
      this.projectiles.delete(msg.projectile_id);
    }

    // Update target health
    if (msg.target_id === this.playerId) {
      this.localPlayer?.applyHealth(msg.new_health);
      window.dispatchEvent(new CustomEvent('healthChanged', {
        detail: { health: msg.new_health, maxHealth: this.localPlayer!.maxHealth },
      }));
    } else {
      this.remotePlayers.get(msg.target_id)?.applyHealth(msg.new_health);
    }
    this.game.events.emit('health_update', { playerId: msg.target_id, health: msg.new_health });

    // Floating damage number above the hit player
    this.showDamageNumber(msg.target_id, msg.damage);
  }

  private handlePlayerDied(msg: any) {
    const killerName = this.displayNames.get(msg.killed_by) ?? msg.killed_by;
    const deadName = this.displayNames.get(msg.player_id) ?? msg.player_id;

    if (msg.player_id === this.playerId) {
      this.localPlayer?.die();
    } else {
      this.remotePlayers.get(msg.player_id)?.die();
    }
    this.game.events.emit('player_died', { playerId: msg.player_id });

    // Kill feed
    const uiScene = this.scene.get('UIScene') as any;
    const feedText = msg.killed_by === 'disconnect'
      ? `${deadName} disconnected`
      : `${killerName} ☕ ${deadName}`;
    uiScene?.addKillFeedEntry?.(feedText);
  }

  private showHitFlash(x: number, y: number) {
    const flash = this.add.circle(x, y, 20, 0xffffff, 0.65).setDepth(6);
    this.tweens.add({
      targets: flash,
      alpha: 0, scale: 3,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
  }

  private showDamageNumber(targetId: string, damage: number) {
    let sprite: Phaser.GameObjects.Image | null = null;
    if (targetId === this.playerId) {
      sprite = this.localPlayer?.sprite ?? null;
    } else {
      sprite = this.remotePlayers.get(targetId)?.sprite ?? null;
    }
    if (!sprite) return;

    const label = `-${Math.round(damage)}`;
    const isLocalPlayer = targetId === this.playerId;
    const color = isLocalPlayer ? '#ff4040' : '#ffcc44';

    const text = this.add.text(
      sprite.x + Phaser.Math.Between(-18, 18),
      sprite.y - 80,
      label,
      {
        fontSize: '22px',
        fontFamily: 'Georgia, serif',
        fontStyle: 'bold',
        color,
        stroke: '#1a0a00',
        strokeThickness: 4,
      }
    ).setDepth(25).setOrigin(0.5, 1);

    this.tweens.add({
      targets: text,
      y: sprite.y - 160,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /** Called by UIScene to get screen-space position of a player sprite. */
  getPlayerScreenPos(playerId: string): { sx: number; sy: number } | null {
    let sprite: Phaser.GameObjects.Image | null = null;
    if (playerId === this.playerId) {
      sprite = this.localPlayer?.sprite ?? null;
    } else {
      sprite = this.remotePlayers.get(playerId)?.sprite ?? null;
    }
    if (!sprite) return null;

    const cam = this.cameras.main;
    return {
      sx: (sprite.x - cam.scrollX) * cam.zoom,
      sy: (sprite.y - cam.scrollY) * cam.zoom,
    };
  }
}
