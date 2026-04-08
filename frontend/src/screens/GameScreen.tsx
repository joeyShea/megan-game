import type { PlayerInfo, CharacterType } from '../types';
import PhaserGame from '../game/PhaserGame';
import HUD from '../components/HUD';

interface Props {
  lobbyCode: string;
  playerId: string;
  players: PlayerInfo[];
}

export default function GameScreen({ lobbyCode, playerId, players }: Props) {
  const me = players.find((p) => p.player_id === playerId);
  return (
    <div className="game-screen">
      <PhaserGame lobbyCode={lobbyCode} playerId={playerId} players={players} />
      <HUD playerId={playerId} character={me?.character as CharacterType ?? null} />
    </div>
  );
}
