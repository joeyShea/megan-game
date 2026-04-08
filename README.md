# Café Clash ☕

Multiplayer top-down coffee-themed brawler. 2–4 players, free-for-all.

## Quick Start

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in multiple browser tabs.

## Controls
- **WASD / Arrow keys** — Move
- **Space** — Fire weapon
- **Q** — Cycle weapon
- Walk over a glowing star pickup to grab a new weapon

## Characters
| Character       | Player  | HP  | Speed | Trait        |
|-----------------|---------|-----|-------|--------------|
| Mia-cchiato     | Mia     | 80  | Fast  | High damage  |
| Amir-icano      | Amir    | 100 | Med   | Balanced     |
| Café Au Landon  | Landen  | 100 | Med   | 3-way shot   |
| Allanchino      | Allan   | 120 | Slow  | Tank         |

## Weapons
| Weapon       | Damage | Notes                |
|--------------|--------|----------------------|
| Coffee Bean  | 12     | Fast, basic          |
| Steam Blast  | 35     | Slow, AoE radius     |
| Milk Frother | 18     | Bounces off walls    |
