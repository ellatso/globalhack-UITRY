

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

  ```
  ffmpeg -version
  ```

---

Also add a tiny **`.env.example`** to the repo so teammates just copy it:

```
REACT_APP_API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
```
