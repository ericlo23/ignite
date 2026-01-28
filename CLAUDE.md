# CLAUDE.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Ignite is a minimalist PWA for instant thought capture. Users sign in with Google OAuth, type a thought, and it syncs to a markdown file (`ignite-thoughts.md`) on their Google Drive. Offline entries are queued in IndexedDB and auto-synced when reconnected.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check (`tsc -b`) then Vite production build
- `npm run preview` — Preview production build locally
- `cd worker && npm run dev` — Start Cloudflare Worker locally (port 8787)
- `cd worker && npm run deploy` — Deploy Worker to Cloudflare

No linter or test runner is configured.

## Environment

### Frontend
Requires in `.env.local` (see `.env.example`):
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `VITE_WORKER_URL` — Auth worker URL (e.g., `http://localhost:8787` for dev)

### Worker
Requires Cloudflare secrets (set via `npx wrangler secret put`):
- `GOOGLE_CLIENT_ID` — Same Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret

Requires KV namespace binding `SESSIONS` (configure in `worker/wrangler.toml`).

## Architecture

```
main.tsx → App.tsx (BrowserRouter)
               ├── "/" — main thought capture UI
               ├── "/auth/callback" — OAuth redirect handler
               ├── "/privacy-policy" (lazy)
               └── "/terms-of-service" (lazy)
```

**Auth flow:** Authorization code flow with Cloudflare Worker as token broker.
1. Frontend redirects to Google OAuth consent screen
2. Google redirects back to `/auth/callback` with auth code
3. Frontend sends code to Worker, which exchanges it for tokens
4. Worker stores refresh token in KV, returns access token + session token
5. Silent refresh via Worker — no popups on token expiry

**Three-layer pattern:**

1. **Services** (`src/services/`) — stateless API wrappers
   - `googleAuth.ts` — Authorization code flow via Worker endpoints (login, callback, refresh, revoke)
   - `googleDrive.ts` — Drive API v3: find/create/append to `ignite-thoughts.md`
   - `storage.ts` — IndexedDB (`ignite-thoughts` db, `pendingEntries` store) for offline queue

2. **Hooks** (`src/hooks/`) — stateful React wrappers over services
   - `useGoogleAuth` — token lifecycle, sign in/out, restore from localStorage
   - `useGoogleDrive` — save thoughts, track save status
   - `useOfflineQueue` — online/offline detection, queue entries, sync pending

3. **Components** (`src/components/`) — UI elements
   - `ThoughtInput` — auto-focus, auto-resize textarea, Cmd/Ctrl+Enter to save
   - `SaveIndicator` — success timestamp or error display
   - `UpdatePrompt` — PWA update notification (checks every 60 min)

**Worker** (`worker/`) — Cloudflare Worker token broker with 4 endpoints:
- `GET /auth/login` — Returns Google OAuth URL
- `POST /auth/callback` — Exchanges auth code for tokens, stores refresh token in KV
- `POST /auth/refresh` — Uses refresh token to get new access token
- `POST /auth/revoke` — Revokes refresh token, clears KV session

**Data flow:** User input → if online, `googleDrive.appendToFile()` → Drive API; if offline, `storage.addEntry()` → IndexedDB → auto-sync later.

## Workflow Rules

- When adding or modifying features, always update `docs/PRODUCT_SPEC.md` accordingly to keep the specification in sync with the actual implementation.

## Key Technical Details

- **OAuth flow:** Authorization code flow with PKCE-like state parameter, Cloudflare Worker as token broker
- **OAuth scope:** `drive.file` (only files created by this app)
- **Token storage:** localStorage keys prefixed `ignite_` (`access_token`, `token_expiry`, `session_token`, `file_id`)
- **Session:** Opaque 32-byte hex token stored in localStorage, maps to refresh token in Worker KV (90-day TTL)
- **Drive file format:** Markdown with `# YYYY-MM-DD` date headers, `## HH:MM AM/PM` time entries, `---` separators
- **PWA:** `vite-plugin-pwa` with Workbox, `registerType: 'prompt'`
- **TypeScript:** strict mode with `noUnusedLocals` and `noUnusedParameters` enabled
- **UI language:** English
- **Fire theme:** dark charcoal background (`#1a0f0a`), flame orange accent (`#ff6b35`), CSS custom properties in `index.css`
