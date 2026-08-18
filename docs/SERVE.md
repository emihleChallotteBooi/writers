# Serving the Project

This project is served by the Node backend server so the frontend and API run together.

## Start Command

From project root:

```bash
npm start
```

Server entrypoint:
- `backend/server.js`

Default URL:
- `http://localhost:5500/`

## Why this setup

- The UI relies on API calls (`/api/archive`) for content loading.
- Serving via Node ensures both static files and API routes are available on one origin.
- This avoids CORS complexity and keeps development simple.

## What gets served

- Static files: served from project root (`index.html`, `ui/`, assets)
- API routes: mounted under `/api`

## Troubleshooting

- If page loads but no content appears:
  - Confirm server is running with `npm start`
  - Check `http://localhost:5500/api/archive` returns JSON
- If port is busy:
  - Set env variable and restart (PowerShell):

```powershell
$env:PORT=5600
npm start
```

Then open `http://localhost:5600/`.
