from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


def _lobby_state_payload(lobby) -> dict:
    return {
        "type": "lobby_state",
        "players": [
            {
                "player_id": p.player_id,
                "display_name": p.display_name,
                "character": p.character,
                "is_host": p.is_host,
                "is_ready": p.is_ready,
            }
            for p in lobby.players.values()
        ],
    }


@router.websocket("/ws/{lobby_code}/{player_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    lobby_code: str,
    player_id: str,
):
    # Access app singletons via websocket.app.state (Request injection
    # doesn't work in WebSocket endpoints)
    lobby_mgr = websocket.app.state.lobby_mgr
    conn_mgr = websocket.app.state.conn_mgr
    game_mgr = websocket.app.state.game_mgr

    lobby_code = lobby_code.upper()
    lobby = lobby_mgr.get_lobby(lobby_code)

    if not lobby or player_id not in lobby.players:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    conn_mgr.connect(player_id, lobby_code, websocket)

    # Send current lobby state to the new connection, then broadcast to all
    await conn_mgr.send_to(player_id, _lobby_state_payload(lobby))
    await conn_mgr.broadcast_to_lobby(lobby_code, _lobby_state_payload(lobby))

    try:
        while True:
            msg = await websocket.receive_json()
            msg_type = msg.get("type")

            if msg_type == "player_state":
                await game_mgr.handle_player_state(lobby_code, msg)

            elif msg_type == "fire_weapon":
                await game_mgr.handle_fire_weapon(lobby_code, msg)

            elif msg_type == "hit_detected":
                await game_mgr.handle_hit_detected(lobby_code, msg)

            elif msg_type == "select_character":
                try:
                    lobby_mgr.set_character(lobby_code, player_id, msg.get("character", ""))
                    await conn_mgr.broadcast_to_lobby(lobby_code, _lobby_state_payload(lobby))
                except ValueError as e:
                    await conn_mgr.send_to(player_id, {"type": "error", "code": str(e), "message": str(e)})

            elif msg_type == "host_start_game":
                if lobby_mgr.can_start(lobby_code, player_id):
                    lobby_mgr.start_game(lobby_code)
                    await conn_mgr.broadcast_to_lobby(lobby_code, {"type": "game_starting", "countdown": 3})
                else:
                    await conn_mgr.send_to(player_id, {
                        "type": "error",
                        "code": "cannot_start",
                        "message": "Need at least 2 players, all with characters selected.",
                    })

            elif msg_type == "player_ready":
                p = lobby.players.get(player_id)
                if p:
                    p.is_ready = True
                await conn_mgr.broadcast_to_lobby(lobby_code, _lobby_state_payload(lobby))

    except WebSocketDisconnect:
        pass
    finally:
        conn_mgr.disconnect(player_id)
        if not lobby.game_started:
            lobby_mgr.remove_player(lobby_code, player_id)
            remaining = lobby_mgr.get_lobby(lobby_code)
            if remaining:
                await conn_mgr.broadcast_to_lobby(lobby_code, _lobby_state_payload(remaining))
        else:
            p = lobby.players.get(player_id)
            if p and p.alive:
                p.alive = False
                await conn_mgr.broadcast_to_lobby(lobby_code, {
                    "type": "player_died",
                    "player_id": player_id,
                    "killed_by": "disconnect",
                })
                await game_mgr._check_win(lobby_code)
