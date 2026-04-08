from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.post("/lobbies")
async def create_lobby(request: Request):
    lobby_mgr = request.app.state.lobby_mgr
    code, player_id = lobby_mgr.create_lobby()
    return {"lobby_code": code, "host_player_id": player_id}


@router.get("/lobbies/{code}/info")
async def lobby_info(code: str, request: Request):
    lobby_mgr = request.app.state.lobby_mgr
    lobby = lobby_mgr.get_lobby(code.upper())
    if not lobby:
        return {"exists": False, "player_count": 0, "max_players": 4, "started": False}
    return {
        "exists": True,
        "player_count": len(lobby.players),
        "max_players": 4,
        "started": lobby.game_started,
    }


@router.post("/lobbies/{code}/join")
async def join_lobby(code: str, request: Request):
    lobby_mgr = request.app.state.lobby_mgr
    try:
        player_id, display_name = lobby_mgr.join_lobby(code.upper())
        return {"player_id": player_id, "display_name": display_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
