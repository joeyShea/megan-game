from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from connection_manager import ConnectionManager
from lobby_manager import LobbyManager
from game_manager import GameManager
from routes.http import router as http_router
from routes.ws import router as ws_router

app = FastAPI(title="megan-game")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singletons stored on app.state
app.state.conn_mgr = ConnectionManager()
app.state.lobby_mgr = LobbyManager()
app.state.game_mgr = GameManager(app.state.lobby_mgr, app.state.conn_mgr)

app.include_router(http_router)
app.include_router(ws_router)
