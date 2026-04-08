import random
import string
import uuid
from models import LobbyState, PlayerState, CHARACTER_BASE_STATS, SPAWN_POINTS


def _gen_code() -> str:
    return "".join(random.choices(string.ascii_uppercase, k=4))


def _gen_name() -> str:
    adjectives = ["Cozy", "Bold", "Sweet", "Warm", "Frothy", "Rich", "Dark", "Smooth"]
    nouns = ["Bean", "Cup", "Roast", "Brew", "Shot", "Foam", "Drop", "Sip"]
    return random.choice(adjectives) + random.choice(nouns)


class LobbyManager:
    def __init__(self):
        self._lobbies: dict[str, LobbyState] = {}

    def create_lobby(self) -> tuple[str, str]:
        code = _gen_code()
        while code in self._lobbies:
            code = _gen_code()
        player_id = str(uuid.uuid4())
        player = PlayerState(
            player_id=player_id,
            display_name=_gen_name(),
            is_host=True,
        )
        lobby = LobbyState(
            lobby_code=code,
            host_player_id=player_id,
            players={player_id: player},
        )
        self._lobbies[code] = lobby
        return code, player_id

    def join_lobby(self, code: str) -> tuple[str, str]:
        """Returns (player_id, display_name) or raises ValueError."""
        lobby = self._get(code)
        if lobby.game_started:
            raise ValueError("already_started")
        if len(lobby.players) >= 4:
            raise ValueError("lobby_full")
        player_id = str(uuid.uuid4())
        name = _gen_name()
        player = PlayerState(player_id=player_id, display_name=name)
        lobby.players[player_id] = player
        return player_id, name

    def get_lobby(self, code: str) -> LobbyState | None:
        return self._lobbies.get(code)

    def set_character(self, code: str, player_id: str, character: str):
        if character not in CHARACTER_BASE_STATS:
            raise ValueError("invalid_character")
        lobby = self._get(code)
        player = lobby.players.get(player_id)
        if not player:
            raise ValueError("player_not_found")
        player.character = character
        player.is_ready = True

    def can_start(self, code: str, requester_id: str) -> bool:
        lobby = self._get(code)
        if requester_id != lobby.host_player_id:
            return False
        if len(lobby.players) < 2:
            return False
        return all(p.character is not None for p in lobby.players.values())

    def start_game(self, code: str):
        lobby = self._get(code)
        lobby.game_started = True
        spawn_list = list(SPAWN_POINTS)
        random.shuffle(spawn_list)
        for i, player in enumerate(lobby.players.values()):
            stats = CHARACTER_BASE_STATS[player.character]
            player.max_health = stats["max_health"]
            player.health = stats["max_health"]
            spawn = spawn_list[i % len(spawn_list)]
            player.x = float(spawn["x"])
            player.y = float(spawn["y"])
            player.alive = True

    def remove_player(self, code: str, player_id: str):
        lobby = self._lobbies.get(code)
        if lobby:
            lobby.players.pop(player_id, None)
            if not lobby.players:
                del self._lobbies[code]
            elif player_id == lobby.host_player_id and lobby.players:
                lobby.host_player_id = next(iter(lobby.players))
                lobby.players[lobby.host_player_id].is_host = True

    def _get(self, code: str) -> LobbyState:
        lobby = self._lobbies.get(code)
        if not lobby:
            raise ValueError("lobby_not_found")
        return lobby
