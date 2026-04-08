# Deployment Guide

This is a full-stack app: the React frontend goes on Vercel, and the Python FastAPI backend needs a separate host. Steps for both are below.

---

## Part 1 — Deploy the Backend

The backend must be deployed first so you have a URL to give the frontend.

### Option A: Railway (easiest, free tier available)

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub repo** → select `megan-game`.
3. Railway will detect the project. Click **Add Service** if it doesn't auto-detect.
4. In the service settings, set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Deploy**. Wait for it to go green.
6. In the service's **Settings → Networking**, click **Generate Domain**.
7. Copy the URL — it will look like `https://megan-game-backend.up.railway.app`. Save it.

### Option B: Render (also free tier)

1. Go to [render.com](https://render.com) → New → **Web Service**.
2. Connect your GitHub repo.
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
4. Click **Create Web Service**.
5. Copy the URL Render gives you (e.g. `https://megan-game.onrender.com`).

---

## Part 2 — Configure the Frontend for Production

The frontend currently uses a Vite dev-proxy to reach the backend. In production you need to point directly at your deployed backend URL.

1. Open `frontend/src/network/WebSocketClient.ts`.

2. Change the `connect` method's `url` line from:
   ```ts
   const url = `/ws/${lobbyCode}/${playerId}`;
   ```
   to:
   ```ts
   const BACKEND = import.meta.env.VITE_BACKEND_URL ?? '';
   const url = `${BACKEND.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/${lobbyCode}/${playerId}`;
   ```

3. Open `frontend/src/App.tsx`. Change every `fetch('/api/...')` call to include the backend URL:
   ```ts
   const API = import.meta.env.VITE_BACKEND_URL ?? '';
   // e.g.:
   fetch(`${API}/lobbies`, { method: 'POST' })
   fetch(`${API}/lobbies/${code}/info`)
   fetch(`${API}/lobbies/${code}/join`, { method: 'POST' })
   ```

4. Create the file `frontend/.env.production`:
   ```
   VITE_BACKEND_URL=https://YOUR-BACKEND-URL-HERE
   ```
   Replace `YOUR-BACKEND-URL-HERE` with the URL from Part 1 (no trailing slash).

---

## Part 3 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**.
3. Import the `megan-game` repository.
4. In the project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - Key: `VITE_BACKEND_URL`
   - Value: your backend URL from Part 1 (e.g. `https://megan-game-backend.up.railway.app`)
6. Click **Deploy**.
7. Vercel will give you a live URL like `https://megan-game.vercel.app`.

---

## Part 4 — Allow CORS from your Vercel domain

1. Open `backend/main.py`.
2. Add your Vercel URL to the `allow_origins` list:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "http://127.0.0.1:5173",
       "https://megan-game.vercel.app",   # ← add this
   ],
   ```
3. Commit and push — Railway/Render will auto-redeploy.

---

## Summary Checklist

- [ ] Backend deployed (Railway or Render) — URL copied
- [ ] `VITE_BACKEND_URL` env var set in Vercel project settings
- [ ] `WebSocketClient.ts` updated to use `VITE_BACKEND_URL`
- [ ] `App.tsx` fetch calls updated to use `VITE_BACKEND_URL`
- [ ] Vercel domain added to backend CORS list
- [ ] Frontend deployed on Vercel — live URL working

---

## Notes

- **WebSockets on Vercel**: Vercel's serverless functions do NOT support WebSockets. This is why the backend must run on Railway/Render. The frontend (React + Phaser, static files) works fine on Vercel.
- **Free tier sleep**: Render's free tier spins down after 15 minutes of inactivity. The first lobby creation after a sleep may take ~30 seconds. Railway's free tier has monthly usage limits.
- **Scaling**: For more than 2–3 concurrent games, upgrade to a paid backend plan so the server doesn't get restarted between games (which would wipe all in-memory lobby state).
