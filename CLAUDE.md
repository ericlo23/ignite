# CLAUDE.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Ignite is a minimalist PWA for instant thought capture. Users sign in with Google OAuth, type a thought, and it syncs to a markdown file (`ignite-thoughts.md`) on their Google Drive. Offline entries are queued in IndexedDB and auto-synced when reconnected.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check (`tsc -b`) then Vite production build
- `npm run preview` — Preview production build locally

No linter or test runner is configured.

## Environment

Requires `VITE_GOOGLE_CLIENT_ID` in `.env.local` (Google OAuth client ID). See `.env.example`.

## Architecture

```
main.tsx → App.tsx (BrowserRouter)
               ├── "/" — main thought capture UI
               ├── "/privacy-policy" (lazy)
               └── "/terms-of-service" (lazy)
```

**Three-layer pattern:**

1. **Services** (`src/services/`) — stateless API wrappers
   - `googleAuth.ts` — Google Identity Services (GIS) OAuth2 token flow
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

**Data flow:** User input → if online, `googleDrive.appendToFile()` → Drive API; if offline, `storage.addEntry()` → IndexedDB → auto-sync later.

## Workflow Rules

- When adding or modifying features, always update `docs/PRODUCT_SPEC.md` accordingly to keep the specification in sync with the actual implementation.

## Key Technical Details

- **OAuth scope:** `drive.file` (only files created by this app)
- **Token storage:** localStorage keys prefixed `ignite_` (`access_token`, `token_expiry`, `file_id`)
- **Drive file format:** Markdown with `# YYYY-MM-DD` date headers, `## HH:MM AM/PM` time entries, `---` separators
- **PWA:** `vite-plugin-pwa` with Workbox, `registerType: 'prompt'`, NetworkFirst caching for Google auth endpoints
- **TypeScript:** strict mode with `noUnusedLocals` and `noUnusedParameters` enabled
- **UI language:** English
- **Fire theme:** dark charcoal background (`#1a0f0a`), flame orange accent (`#ff6b35`), CSS custom properties in `index.css`
