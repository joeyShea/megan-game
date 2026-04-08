import math
import uuid
from models import CHARACTER_BASE_STATS, WEAPON_STATS, MAX_MAP_DIST
from connection_manager import ConnectionManager
from lobby_manager import LobbyManager

# Max distance a projectile could have plausibly traveled in 2 seconds (generous)
HIT_VALIDATION_MAX_DIST = 1000.0


class GameManager:
    def __init__(self, lobby_mgr: LobbyManager, conn_mgr: ConnectionManager):
        self._lobby_mgr = lobby_mgr
        self._conn_mgr = conn_mgr

    async def handle_fire_weapon(self, lobby_code: str, msg: dict):
        lobby = self._lobby_mgr.get_lobby(lobby_code)
        if not lobby or not lobby.game_started:
            return
        shooter = lobby.players.get(msg["player_id"])
        if not shooter or not shooter.alive:
            return

        weapon = msg.get("weapon", "coffee_bean")
        if weapon not in WEAPON_STATS:
            return

        stats = WEAPON_STATS[weapon]
        char_stats = CHARACTER_BASE_STATS.get(shooter.character, {})
        dmg_mult = char_stats.get("damage_multiplier", 1.0)
        base_damage = stats["damage"] * dmg_mult
        direction = float(msg.get("direction", 0))

        # Café Au Landon: wide shot — three projectiles in a fan
        if shooter.character == "cafeaulandon":
            offsets = [-0.26, 0.0, 0.26]  # ~15 degrees in radians
        else:
            offsets = [0.0]

        for offset in offsets:
            proj_id = str(uuid.uuid4())
            await self._conn_mgr.broadcast_to_lobby(lobby_code, {
                "type": "projectile_spawned",
                "projectile_id": proj_id,
                "owner_id": shooter.player_id,
                "weapon": weapon,
                "origin_x": float(msg.get("origin_x", shooter.x)),
                "origin_y": float(msg.get("origin_y", shooter.y)),
                "direction": direction + offset,
                "speed": stats["speed"],
                "damage": base_damage,
                "radius": stats["radius"],
                "bounces_remaining": stats["bounces"],
            })

    async def handle_hit_detected(self, lobby_code: str, msg: dict):
        lobby = self._lobby_mgr.get_lobby(lobby_code)
        if not lobby or not lobby.game_started:
            return

        shooter = lobby.players.get(msg.get("shooter_id", ""))
        target = lobby.players.get(msg.get("target_id", ""))
        if not shooter or not target or not target.alive:
            return

        # Validate: shooter must be alive
        if not shooter.alive:
            return

        # Validate: rough distance check (target must be on the map)
        dist = math.hypot(shooter.x - target.x, shooter.y - target.y)
        if dist > HIT_VALIDATION_MAX_DIST:
            return

        weapon = msg.get("weapon", "coffee_bean")
        if weapon not in WEAPON_STATS:
            return

        stats = WEAPON_STATS[weapon]
        char_stats = CHARACTER_BASE_STATS.get(shooter.character, {})
        dmg_mult = char_stats.get("damage_multiplier", 1.0)
        damage = stats["damage"] * dmg_mult

        target.health = max(0.0, target.health - damage)

        await self._conn_mgr.broadcast_to_lobby(lobby_code, {
            "type": "hit_registered",
            "projectile_id": msg.get("projectile_id", ""),
            "target_id": target.player_id,
            "damage": damage,
            "new_health": target.health,
        })

        if target.health <= 0:
            target.alive = False
            await self._conn_mgr.broadcast_to_lobby(lobby_code, {
                "type": "player_died",
                "player_id": target.player_id,
                "killed_by": shooter.player_id,
            })
            await self._check_win(lobby_code)

    async def _check_win(self, lobby_code: str):
        lobby = self._lobby_mgr.get_lobby(lobby_code)
        if not lobby:
            return
        alive = [p for p in lobby.players.values() if p.alive]
        if len(alive) <= 1:
            lobby.game_over = True
            winner_id = alive[0].player_id if alive else None
            lobby.winner_id = winner_id
            # Build placements: winner first, then sorted by health desc
            dead = sorted(
                [p for p in lobby.players.values() if not p.alive],
                key=lambda p: p.health,
                reverse=True,
            )
            placements = ([winner_id] if winner_id else []) + [p.player_id for p in dead]
            await self._conn_mgr.broadcast_to_lobby(lobby_code, {
                "type": "game_over",
                "winner_id": winner_id,
                "placements": placements,
            })

    async def handle_player_state(self, lobby_code: str, msg: dict):
        """Update server-side player position (for hit validation only)."""
        lobby = self._lobby_mgr.get_lobby(lobby_code)
        if not lobby or not lobby.game_started:
            return
        player = lobby.players.get(msg.get("player_id", ""))
        if not player or not player.alive:
            return
        # Only accept if sequence is newer
        seq = int(msg.get("sequence", 0))
        if seq < player.sequence:
            return
        player.sequence = seq
        player.x = float(msg.get("x", player.x))
        player.y = float(msg.get("y", player.y))
        player.velocity_x = float(msg.get("velocity_x", 0))
        player.velocity_y = float(msg.get("velocity_y", 0))
        player.direction = float(msg.get("direction", 0))
        player.animation_state = str(msg.get("animation_state", "idle"))

        # Broadcast world state to all players in lobby
        all_states = []
        for p in lobby.players.values():
            all_states.append({
                "player_id": p.player_id,
                "x": p.x,
                "y": p.y,
                "velocity_x": p.velocity_x,
                "velocity_y": p.velocity_y,
                "direction": p.direction,
                "animation_state": p.animation_state,
                "health": p.health,
                "alive": p.alive,
            })

        await self._conn_mgr.broadcast_to_lobby(lobby_code, {
            "type": "world_state",
            "players": all_states,
        })
