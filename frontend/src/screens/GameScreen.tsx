import type { PlayerInfo } from '../types';
import PhaserGame from '../game/PhaserGame';
import HUD from '../components/HUD';

interface Props {
  lobbyCode: string;
  playerId: string;
  players: PlayerInfo[];
}

export default function GameScreen({ lobbyCode, playerId, players }: Props) {
  return (
    <div className="game-screen">
      <PhaserGame lobbyCode={lobbyCode} playerId={playerId} players={players} />
      <HUD playerId={playerId} />
    </div>
  );
}
