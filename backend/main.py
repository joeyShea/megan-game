import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from connection_manager import ConnectionManager
from lobby_manager import LobbyManager
from game_manager import GameManager
from routes.http import router as http_router
from routes.ws import router as ws_router

app = FastAPI(title="megan-game")

# ALLOWED_ORIGINS env var lets render.yaml (or any deployment) inject
# the live frontend URL without changing code.
_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"] + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.conn_mgr = ConnectionManager()
app.state.lobby_mgr = LobbyManager()
app.state.game_mgr = GameManager(app.state.lobby_mgr, app.state.conn_mgr)

app.include_router(http_router)
app.include_router(ws_router)
