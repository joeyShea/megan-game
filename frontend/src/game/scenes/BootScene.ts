import Phaser from 'phaser';
import { SpriteFactory } from '../graphics/SpriteFactory';
import type { PlayerInfo } from '../../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load PNG character sprites from /public
    this.load.image('char_miacchiato',   '/Macchiato.png');
    this.load.image('char_americano',    '/Americano.png');
    this.load.image('char_cafeaulandon', '/cafe.png');
    this.load.image('char_allanchino',   '/cappuchino.png');
  }

  create() {
    const factory = new SpriteFactory(this);
    factory.generateAll();
    const playerId = this.game.registry.get('playerId') as string;
    const players = this.game.registry.get('players') as PlayerInfo[];
    this.scene.start('GameScene', { playerId, players });
  }
}
