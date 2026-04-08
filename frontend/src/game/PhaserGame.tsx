import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from './config';
import type { PlayerInfo } from '../types';

interface Props {
  lobbyCode: string;
  playerId: string;
  players: PlayerInfo[];
}

export default function PhaserGame({ lobbyCode, playerId, players }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current) return; // already initialized

    const config = createPhaserConfig(containerRef.current, playerId, players, lobbyCode);
    gameRef.current = new Phaser.Game(config);

    // Wire up GameScene init data via registry (already done in preBoot callback)

    const handleResize = () => {
      gameRef.current?.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
}
