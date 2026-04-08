import Phaser from 'phaser';

interface PlayerHealthEntry {
  bgSprite: Phaser.GameObjects.Image;
  fillSprite: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  health: number;
  maxHealth: number;
  alive: boolean;
}

export class UIScene extends Phaser.Scene {
  private healthBars: Map<string, PlayerHealthEntry> = new Map();
  private killFeedTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Listen to events from GameScene
    this.game.events.on('health_update', this.onHealthUpdate, this);
    this.game.events.on('player_died', this.onPlayerDied, this);
    this.game.events.on('register_player', this.onRegisterPlayer, this);
  }

  onRegisterPlayer(data: { playerId: string; displayName: string; maxHealth: number }) {
    const bg   = this.add.image(0, 0, 'hpbar_bg').setDepth(10).setVisible(false).setOrigin(0, 0.5);
    const fill = this.add.image(0, 0, 'hpbar_fill').setDepth(11).setVisible(false).setOrigin(0, 0.5);
    const nameText = this.add.text(0, 0, data.displayName, {
      fontSize: '9px', color: '#fdf6e3',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(12).setVisible(false).setOrigin(0.5, 1);

    this.healthBars.set(data.playerId, {
      bgSprite: bg,
      fillSprite: fill,
      nameText,
      health: data.maxHealth,
      maxHealth: data.maxHealth,
      alive: true,
    });
  }

  onHealthUpdate(data: { playerId: string; health: number }) {
    const entry = this.healthBars.get(data.playerId);
    if (entry) entry.health = data.health;
  }

  onPlayerDied(data: { playerId: string }) {
    const entry = this.healthBars.get(data.playerId);
    if (entry) {
      entry.alive = false;
      entry.health = 0;
    }
  }

  addKillFeedEntry(text: string) {
    const t = this.add.text(
      this.cameras.main.width - 10, 10 + this.killFeedTexts.length * 18,
      text, { fontSize: '11px', color: '#fdf6e3', stroke: '#000', strokeThickness: 2 }
    ).setScrollFactor(0).setDepth(20).setOrigin(1, 0);
    this.killFeedTexts.push(t);
    this.time.delayedCall(4000, () => {
      t.destroy();
      this.killFeedTexts = this.killFeedTexts.filter((x) => x !== t);
    });
  }

  update() {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene) return;

    const cam = gameScene.cameras?.main;
    if (!cam) return;

    // Update each health bar position to track player sprites
    this.healthBars.forEach((entry, playerId) => {
      const spritePos = gameScene.getPlayerScreenPos?.(playerId);
      if (!spritePos) {
        entry.bgSprite.setVisible(false);
        entry.fillSprite.setVisible(false);
        entry.nameText.setVisible(false);
        return;
      }

      const BAR_W = 40;
      const sx = spritePos.sx;
      const sy = spritePos.sy;
      const barX = sx - BAR_W / 2;
      const barY = sy - 26;

      entry.bgSprite
        .setPosition(barX, barY)
        .setVisible(true)
        .setScrollFactor(0);

      const pct = Math.max(0, entry.health / entry.maxHealth);
      const fillKey = pct < 0.3 ? 'hpbar_fill_low' : 'hpbar_fill';
      entry.fillSprite
        .setTexture(fillKey)
        .setPosition(barX, barY)
        .setScale(pct, 1)
        .setVisible(entry.alive)
        .setScrollFactor(0);

      entry.nameText
        .setPosition(sx, barY - 4)
        .setVisible(true)
        .setScrollFactor(0);
    });
  }

  shutdown() {
    this.game.events.off('health_update', this.onHealthUpdate, this);
    this.game.events.off('player_died', this.onPlayerDied, this);
    this.game.events.off('register_player', this.onRegisterPlayer, this);
  }
}
