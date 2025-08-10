Yep—I looked at your repo. Two key points:

1. **This repo is Create React App (CRA), not Vite.**
   So your teammate should run **`npm start`** (port 3000), not `npm run dev`. And CRA uses env vars that start with **`REACT_APP_`** (but I already made the frontend read both `VITE_API_URL` and `REACT_APP_API_URL`, so you’re safe if you include either).

2. What’s missing is just **clear setup docs + a sample `.env`**. You don’t need to push `node_modules`.

Here’s a drop-in README section you can paste so your teammate can open it on their PC with zero guesswork:

---

# PsyCoach UI – Local Setup

## Prereqs

* Node.js 18+ and npm

  ```
  node -v
  npm -v
  ```

## 1) Install deps

```
npm install
```

## 2) Environment variables

Create a file named **`.env`** in the project root (same folder as `package.json`) with:

```
# Backend URL (FastAPI)
REACT_APP_API_URL=http://localhost:8000
# Kept for compatibility if using Vite later
VITE_API_URL=http://localhost:8000
```

> After editing `.env`, **restart** the dev server—env vars load only at startup.

## 3) Start the frontend (CRA)

```
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 4) Start the backend (on the same PC)

From the folder that has `api.py` and `voice.py`:

```
pip install fastapi uvicorn pydantic python-multipart aiofiles
# If using STT/TTS endpoints also:
# pip install av soundfile faster-whisper pyttsx3
# And install ffmpeg (ffmpeg -version should print a version)

uvicorn api:app --reload --port 8000
```

Verify [http://localhost:8000/docs](http://localhost:8000/docs) shows the PsyCoach API.

## 5) Test from the UI

* Click **Create Session** → you should see a `sessionId`.
* Optional: use the mic (needs ffmpeg + audio deps on backend).

## Troubleshooting

* **“Cannot read properties of undefined (reading 'VITE\_API\_URL')”**
  Restart `npm start`. Ensure `.env` exists and contains the lines above.
* **405 Method Not Allowed on `/voice/*`**
  Make sure the UI is sending **POST** (don’t open those URLs directly in the browser).
* **Mic upload fails / STT errors**
  Install ffmpeg and audio deps on backend, then reopen the terminal:

  ```
  ffmpeg -version
  ```

---

Also add a tiny **`.env.example`** to the repo so teammates just copy it:

```
REACT_APP_API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
```

If you want, I can PR your repo with:

* `README.md` update,
* `.env.example`,
* (optional) install script for deps.
