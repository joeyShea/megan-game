from dataclasses import dataclass, field
from typing import Optional

CHARACTER_BASE_STATS: dict = {
    "miacchiato":   {"max_health": 80,  "speed": 220, "damage_multiplier": 1.4,  "color": "8b4513"},
    "americano":    {"max_health": 100, "speed": 160, "damage_multiplier": 1.0,  "color": "2d5a27"},
    "cafeaulandon": {"max_health": 100, "speed": 150, "damage_multiplier": 1.0,  "color": "d4a574"},
    "allanchino":   {"max_health": 120, "speed": 110, "damage_multiplier": 0.75, "color": "4a7c59"},
}

WEAPON_STATS: dict = {
    "coffee_bean":  {"speed": 480, "damage": 12, "radius": 0,  "bounces": 0},
    "steam_blast":  {"speed": 180, "damage": 35, "radius": 80, "bounces": 0},
    "milk_frother": {"speed": 300, "damage": 18, "radius": 0,  "bounces": 3},
}

SPAWN_POINTS = [
    {"x": 96,   "y": 96},
    {"x": 1504, "y": 96},
    {"x": 96,   "y": 1504},
    {"x": 1504, "y": 1504},
]

MAX_MAP_DIST = 1600 * 1.5  # generous validation threshold


@dataclass
class PlayerState:
    player_id: str
    display_name: str
    character: Optional[str] = None
    is_host: bool = False
    is_ready: bool = False
    # Game coords (populated on start)
    x: float = 0.0
    y: float = 0.0
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    direction: float = 0.0
    animation_state: str = "idle"
    health: float = 100.0
    max_health: float = 100.0
    alive: bool = True
    sequence: int = 0


@dataclass
class LobbyState:
    lobby_code: str
    host_player_id: str
    players: dict = field(default_factory=dict)  # player_id -> PlayerState
    game_started: bool = False
    game_over: bool = False
    winner_id: Optional[str] = None
