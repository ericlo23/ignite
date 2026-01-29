# Ignite - Product Specification

## Overview

**Ignite** is a minimalist Progressive Web App (PWA) designed for capturing fleeting thoughts and ideas instantly, with automatic synchronization to Google Drive.

## Core Concept

A zero-friction thought capture tool that lets you record ideas the moment they strike, before they slip away.

## Product Name

**Ignite** - To spark, to kindle, to inspire

## Value Proposition

| Value                 | Description                                       |
| --------------------- | ------------------------------------------------- |
| **Instant Capture**   | Ideas are fleeting - record them in seconds       |
| **Minimal Interface** | Zero barriers, pure focus on content              |
| **Local-First**       | Works without sign-in, all data stored locally    |
| **Optional Sync**     | Sign in to sync across devices via Google Drive   |
| **Offline Ready**     | Works without internet, syncs when reconnected    |

## Target Users

- Creative professionals
- Developers and engineers
- Students and researchers
- Anyone who needs to quickly capture thoughts on the go

## Use Cases

- Sudden idea during commute
- Late-night inspiration that can't wait
- Quick thought during meetings
- Any "I'll forget this if I don't write it now" moment

## Features

### Core Features

1. **Text Input**
   - Large, auto-focused textarea
   - Supports native keyboard voice input
   - Clean, distraction-free interface

2. **Local-First Storage**
   - All thoughts stored locally in IndexedDB
   - No sign-in required for core functionality
   - Instant saves with no network dependency
   - Review thoughts offline anytime

3. **Optional Multi-Device Sync**
   - Sign in with Google to enable cross-device sync
   - Automatic bidirectional sync with Google Drive
   - Stores thoughts in a single Markdown file (`ignite-thoughts.md`)
   - Automatic timestamps for each entry
   - Entries organized by date
   - Conflict resolution based on timestamp deduplication

4. **PWA Capabilities**
   - Installable on mobile home screen
   - Works completely offline
   - Auto-updates in background

5. **Intelligent Sync**
   - Startup sync: Auto-merges Drive content with local on app open
   - Background sync: Uploads new thoughts to Drive when signed in
   - Periodic sync: Pulls updates every 5 minutes
   - Visibility sync: Syncs when tab becomes active
   - Visual indicator for pending sync status

6. **Automatic Session Persistence**
   - Uses authorization code flow with a Cloudflare Worker as token broker
   - Refresh tokens stored server-side in KV — no client secret exposed
   - Silently refreshes access token via Worker before expiry (5-minute buffer)
   - Re-validates token when a backgrounded tab returns to foreground
   - Falls back to sign-in screen if the session has expired
   - No popup flash on refresh — fully server-side token renewal
   - Updates auth state immediately after OAuth callback (no refresh required)
   - Provides a reauthorization help page explaining the Drive permission checkbox
   - Verifies granted scopes after login and redirects to reauthorize if Drive access is missing

7. **Thought Review**
   - View all captured thoughts from IndexedDB (fast, offline-capable)
   - Thoughts grouped by date with individual timestamps
   - Visual badges indicate sync status ("Not synced" for pending)
   - Clean, readable interface following fire theme
   - Navigate via Review button in header
   - No sign-in required to review local thoughts

### User Flow (Local-First)

```
Open App → Type thought → Save (instant) → Done
```

Optional: Sign in to enable multi-device sync

```
Open App → Sign In → Auto-sync from Drive → Type thought → Save (local + cloud) → Done
```

### Review Flow

```
Open App → Review Thoughts (from local IndexedDB) → Browse by date → Return to Capture
```

Works offline, no sign-in required

## Technical Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Auth Backend**: Cloudflare Worker (token broker)
- **PWA**: vite-plugin-pwa (Workbox)
- **Primary Storage**: IndexedDB (idb) - local-first, all thoughts stored here
- **Sync Storage**: Google Drive API - optional backup/sync for multi-device
- **Thought Parser**: Utility for parsing markdown ↔ ThoughtEntry conversion
- **Storage Service**: Core data layer with save, merge, and sync functions
- **useGoogleDrive Hook**: Hook for Drive sync operations (pullAndMerge, syncThoughtToDrive)
- **ReviewPage**: Component reading directly from IndexedDB for fast offline access

### Architecture: Local-First with Optional Sync

**Three-Layer Pattern:**

1. **Storage Layer** (`src/services/storage.ts`)
   - IndexedDB as single source of truth
   - Schema: `thoughts` store with timestamp-based IDs
   - Functions: `saveThought()`, `getAllThoughts()`, `mergeThoughtsFromDrive()`
   - Sync tracking via `syncedToDrive` boolean flag

2. **Sync Layer** (`src/services/googleDrive.ts` + `src/hooks/useGoogleDrive.ts`)
   - `pullAndMerge()`: Download from Drive → merge to local → upload pending
   - `syncThoughtToDrive()`: Single thought background upload
   - Conflict resolution: timestamp-based deduplication, lastModified comparison

3. **UI Layer** (`src/App.tsx`, `src/pages/ReviewPage.tsx`)
   - App: Always saves to IndexedDB first, backgrounds sync if signed in
   - Review: Reads only from IndexedDB (fast, offline-capable)
   - Sync hints guide users to optional sign-in for multi-device

**Data Flow:**

```
User Input → saveThought(local) → updateUI → [if signed in] syncThoughtToDrive(bg)

App Start → [if signed in] pullAndMerge() → merge Drive + local → mark synced

Review → getAllThoughts(local) → display with sync badges
```

### Data Format

Thoughts are stored as Markdown in Google Drive with millisecond-precision timestamps:

```markdown
# 2026-01-26

## 09:15 AM <!-- 1738156523456 -->

First thought of the day captured here.

---

## 02:30 PM <!-- 1738163423789 -->

Another idea that came to mind.

---
```

The HTML comment contains the precise millisecond timestamp, ensuring:
- Exact timestamp preservation during sync (no precision loss)
- Reliable deduplication by timestamp
- Backward compatibility (old format without timestamp still parseable)
- Human readability maintained (comment is invisible in markdown viewers)

## Visual Design

### Color Palette

**Fire & Flame Theme** - Warm, energetic colors that embody the "ignited" concept

| Role                 | Color             | Hex       |
| -------------------- | ----------------- | --------- |
| Primary/Accent       | Flame Orange      | `#ff6b35` |
| Accent Hover         | Light Orange Glow | `#ff8956` |
| Background Primary   | Deep Charcoal     | `#1a0f0a` |
| Background Secondary | Warm Dark Brown   | `#2a1810` |
| Background Tertiary  | Ember Glow        | `#3d2416` |
| Text Primary         | Firelight Cream   | `#ffecd1` |
| Text Secondary       | Warm Bronze       | `#d4a574` |
| Success              | Warm Amber        | `#ffa726` |
| Error                | Ember Red         | `#ff5252` |
| Warning              | Golden Flame      | `#ffb300` |

### Design Principles

1. **Fire Theme** - Warm, energetic dark mode that embodies creative ignition. Easy on the eyes while conveying the spark of inspiration
2. **Mobile-First** - Optimized for phone usage with large, touch-friendly interface
3. **Minimal Chrome** - Maximum space for content, distraction-free capture
4. **Instant Feedback** - Clear save status indicators with fire-themed colors
5. **Warm & Inviting** - Ember tones create an inspiring atmosphere rather than clinical coldness

### Theme Rationale

The **Fire & Flame** color scheme directly connects to the product name "Ignite" and its core purpose:

- **Fire = Creativity**: Fire symbolizes creative energy, passion, and inspiration
- **Ember Backgrounds**: Dark charcoal and warm brown evoke burning coals and firewood - the fuel for ideas
- **Flame Orange Accent**: The vibrant orange represents the moment of ignition - when an idea "catches fire"
- **Warm Text**: Firelight-illuminated cream and bronze suggest thoughts being written by candlelight or campfire
- **Amber Success**: Instead of traditional green, amber represents "spark caught" or "flame sustained"

This theme creates emotional resonance with the act of capturing fleeting thoughts - like catching sparks before they fade.

### UI Layout

The interface follows a fixed-status-bar layout to prevent visual jumping:

**Structure:**
```
Header (logo, actions, badges)
  ↓
Status Bar (fixed height)
  ├─ Update Prompt (PWA updates)
  ├─ Save Indicator (last saved time / errors)
  ├─ Sync Status (pending sync count)
  └─ Error Hint (auth/sync errors + reauth link)
  ↓
Capture Container (50vh max height)
  └─ Thought Input (textarea + save button)
  ↓
Footer (privacy links)
```

**Design Goals:**
- **No Layout Shift**: Status bar maintains fixed height (60-180px), preventing textarea from jumping when status messages appear
- **Constrained Input**: Textarea limited to ~50% of viewport height (50vh desktop, 40vh mobile), leaving room for status
- **Unified Status Area**: All transient messages (updates, saves, errors, sync) appear in a single scrollable region
- **Always Visible**: Status bar never disappears, ensuring consistent layout even when empty

**Status Bar Behavior:**
- Min height: 60px (ensures presence even when empty)
- Max height: 180px (prevents overwhelming the interface)
- Overflow: Auto-scroll when multiple statuses appear
- Animation: Smooth fade-in when status items appear/disappear

This layout ensures the thought capture experience remains stable and predictable, regardless of sync status or system messages.
