import Phaser from 'phaser';

const BAR_W = 80;
// Distance above the sprite center where the bar sits (sprite is 144px tall → top at -72)
const BAR_OFFSET_Y = 92;
const NAME_OFFSET_Y = BAR_OFFSET_Y + 14;

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
    this.game.events.on('health_update',   this.onHealthUpdate,   this);
    this.game.events.on('player_died',     this.onPlayerDied,     this);
    this.game.events.on('register_player', this.onRegisterPlayer, this);
  }

  onRegisterPlayer(data: { playerId: string; displayName: string; maxHealth: number }) {
    const bg = this.add.image(0, 0, 'hpbar_bg')
      .setDepth(10).setVisible(false).setOrigin(0, 0.5);
    const fill = this.add.image(0, 0, 'hpbar_fill')
      .setDepth(11).setVisible(false).setOrigin(0, 0.5);
    const nameText = this.add.text(0, 0, data.displayName, {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#fdf6e3',
      stroke: '#1a0a00',
      strokeThickness: 3,
    }).setDepth(12).setVisible(false).setOrigin(0.5, 0);

    this.healthBars.set(data.playerId, { bgSprite: bg, fillSprite: fill, nameText, health: data.maxHealth, maxHealth: data.maxHealth, alive: true });
  }

  onHealthUpdate(data: { playerId: string; health: number }) {
    const entry = this.healthBars.get(data.playerId);
    if (entry) entry.health = Math.max(0, data.health);
  }

  onPlayerDied(data: { playerId: string }) {
    const entry = this.healthBars.get(data.playerId);
    if (entry) { entry.alive = false; entry.health = 0; }
  }

  addKillFeedEntry(text: string) {
    // Reposition existing entries downward
    this.killFeedTexts.forEach((t, i) => t.setY(14 + (i + 1) * 22));

    const t = this.add.text(
      this.cameras.main.width - 14, 14,
      text,
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#fdf6e3', stroke: '#1a0a00', strokeThickness: 3 }
    ).setScrollFactor(0).setDepth(20).setOrigin(1, 0);

    this.killFeedTexts.unshift(t);

    this.time.delayedCall(4000, () => {
      t.destroy();
      this.killFeedTexts = this.killFeedTexts.filter((x) => x !== t);
    });
  }

  update() {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene) return;

    this.healthBars.forEach((entry, playerId) => {
      const pos = gameScene.getPlayerScreenPos?.(playerId);
      if (!pos) {
        entry.bgSprite.setVisible(false);
        entry.fillSprite.setVisible(false);
        entry.nameText.setVisible(false);
        return;
      }

      const { sx, sy } = pos;
      const barX = sx - BAR_W / 2;
      const barY = sy - BAR_OFFSET_Y;

      entry.bgSprite.setPosition(barX, barY).setVisible(true).setScrollFactor(0);

      const pct = Math.max(0, entry.health / entry.maxHealth);
      const fillKey = pct < 0.3 ? 'hpbar_fill_low' : pct < 0.6 ? 'hpbar_fill_mid' : 'hpbar_fill';
      entry.fillSprite
        .setTexture(fillKey)
        .setPosition(barX, barY)
        .setScale(pct, 1)
        .setVisible(entry.alive)
        .setScrollFactor(0);

      entry.nameText
        .setPosition(sx, sy - NAME_OFFSET_Y)
        .setVisible(true)
        .setScrollFactor(0);
    });
  }

  shutdown() {
    this.game.events.off('health_update',   this.onHealthUpdate,   this);
    this.game.events.off('player_died',     this.onPlayerDied,     this);
    this.game.events.off('register_player', this.onRegisterPlayer, this);
  }
}
