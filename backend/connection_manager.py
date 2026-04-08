from fastapi import WebSocket
from typing import Optional


class ConnectionManager:
    def __init__(self):
        # player_id -> WebSocket
        self._connections: dict[str, WebSocket] = {}
        # player_id -> lobby_code (so we can broadcast to a lobby)
        self._player_lobby: dict[str, str] = {}
        # lobby_code -> set of player_ids
        self._lobby_players: dict[str, set] = {}

    def connect(self, player_id: str, lobby_code: str, ws: WebSocket):
        self._connections[player_id] = ws
        self._player_lobby[player_id] = lobby_code
        self._lobby_players.setdefault(lobby_code, set()).add(player_id)

    def disconnect(self, player_id: str):
        self._connections.pop(player_id, None)
        lobby_code = self._player_lobby.pop(player_id, None)
        if lobby_code and lobby_code in self._lobby_players:
            self._lobby_players[lobby_code].discard(player_id)
            if not self._lobby_players[lobby_code]:
                del self._lobby_players[lobby_code]

    def get_lobby_for_player(self, player_id: str) -> Optional[str]:
        return self._player_lobby.get(player_id)

    async def send_to(self, player_id: str, msg: dict):
        ws = self._connections.get(player_id)
        if ws:
            try:
                await ws.send_json(msg)
            except Exception:
                pass

    async def broadcast_to_lobby(self, lobby_code: str, msg: dict):
        player_ids = list(self._lobby_players.get(lobby_code, set()))
        for pid in player_ids:
            await self.send_to(pid, msg)
