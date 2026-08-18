# Backend Decisions

This file summarizes backend architecture choices and why they were made.

## 1) Express as a thin server

Decision:
- Use Express for both static hosting and API routing.

Why:
- Minimal overhead.
- Easy local setup with `npm start`.
- One runtime handles frontend and API.

## 2) Content source on server filesystem

Decision:
- Store canonical markdown under `server-side/content/`.

Why:
- Keeps source writing human-readable and versionable.
- Avoids hardcoded file maps in frontend.
- Allows API to discover content dynamically.

## 3) Dedicated API module folder

Decision:
- Keep API route logic in `backend/apis/`.

Why:
- Cleaner separation from server bootstrap.
- Easier to add new endpoints without bloating `server.js`.

Current module:
- `backend/apis/archive-api.js`

## 4) Simple archive endpoint contract

Decision:
- Return raw markdown plus file path metadata.

Why:
- Frontend already owns parsing/rendering pipeline.
- Keeps backend neutral and lightweight.
- Supports future parser changes without backend rewrites.

## 5) Local cache fallback on frontend

Decision:
- Frontend still caches API responses to IndexedDB.

Why:
- Better resilience and UX for intermittent connectivity.
- Faster repeat loads.

## Future extension options

- Add `GET /api/archive/:slug` for piece-specific fetch.
- Add write endpoints for server-side persistence workflows.
- Add auth layer for protected admin operations.
- Add validation middleware for stricter API contracts.
