import { useState, useEffect } from 'react';
import type { ScreenName, PlayerInfo, GameOverData } from './types';
import { wsClient } from './network/WebSocketClient';
import HomeScreen from './screens/HomeScreen';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import WinScreen from './screens/WinScreen';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInfo[]>([]);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  useEffect(() => {
    const unsub1 = wsClient.subscribe('lobby_state', (msg) => {
      setLobbyPlayers((msg as any).players ?? []);
    });
    const unsub2 = wsClient.subscribe('game_starting', () => {
      setScreen('game');
    });
    const unsub3 = wsClient.subscribe('game_over', (msg) => {
      setGameOverData({ winner_id: msg.winner_id as string, placements: msg.placements as string[] });
      // Small delay so last hit_registered updates render before switching screens
      setTimeout(() => setScreen('win'), 1500);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleCreateLobby = async () => {
    try {
      const res = await fetch('/api/lobbies', { method: 'POST' });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setLobbyCode(data.lobby_code);
      setPlayerId(data.host_player_id);
      await wsClient.connect(data.lobby_code, data.host_player_id);
      setScreen('lobby');
    } catch {
      alert('Could not reach the server. Make sure the backend is running on port 8000.');
    }
  };

  const handleJoinLobby = async (code: string) => {
    try {
      const infoRes = await fetch(`/api/lobbies/${code}/info`);
      if (!infoRes.ok) throw new Error('Server error');
      const info = await infoRes.json();
      if (!info.exists) { alert('Lobby not found.'); return; }
      if (info.started) { alert('Game already started.'); return; }
      if (info.player_count >= 4) { alert('Lobby is full.'); return; }

      const res = await fetch(`/api/lobbies/${code}/join`, { method: 'POST' });
      if (!res.ok) { const e = await res.json(); alert(e.detail ?? 'Could not join'); return; }
      const data = await res.json();
      setLobbyCode(code.toUpperCase());
      setPlayerId(data.player_id);
      await wsClient.connect(code.toUpperCase(), data.player_id);
      setScreen('lobby');
    } catch {
      alert('Could not reach the server. Make sure the backend is running on port 8000.');
    }
  };

  const handlePlayAgain = () => {
    wsClient.disconnect();
    setLobbyCode('');
    setPlayerId('');
    setLobbyPlayers([]);
    setGameOverData(null);
    setScreen('home');
  };

  return (
    <div className="app">
      {screen === 'home' && <HomeScreen onCreate={handleCreateLobby} onJoin={() => setScreen('join')} />}
      {screen === 'join' && <JoinScreen onJoin={handleJoinLobby} onBack={() => setScreen('home')} />}
      {screen === 'lobby' && (
        <LobbyScreen lobbyCode={lobbyCode} playerId={playerId} players={lobbyPlayers} />
      )}
      {screen === 'game' && (
        <GameScreen lobbyCode={lobbyCode} playerId={playerId} players={lobbyPlayers} />
      )}
      {screen === 'win' && gameOverData && (
        <WinScreen gameOverData={gameOverData} players={lobbyPlayers} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
