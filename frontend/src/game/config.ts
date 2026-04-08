import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import type { PlayerInfo } from '../types';

export function createPhaserConfig(
  parent: HTMLElement,
  playerId: string,
  players: PlayerInfo[],
  lobbyCode: string,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#f0e4cc',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene, UIScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('playerId', playerId);
        game.registry.set('players', players);
        game.registry.set('lobbyCode', lobbyCode);
      },
    },
  };
}
