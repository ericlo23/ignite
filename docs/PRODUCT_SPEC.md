# Ignite - Product Specification

## Overview

**Ignite** is a minimalist Progressive Web App (PWA) designed for capturing fleeting thoughts and ideas instantly, with automatic synchronization to Google Drive.

## Core Concept

A zero-friction thought capture tool that lets you record ideas the moment they strike, before they slip away.

## Product Name

**Ignite** - To spark, to kindle, to inspire

## Value Proposition

| Value | Description |
|-------|-------------|
| **Instant Capture** | Ideas are fleeting - record them in seconds |
| **Minimal Interface** | Zero barriers, pure focus on content |
| **Cloud Sync** | Saved to Google Drive, accessible anywhere |
| **Offline Ready** | Works without internet, syncs when reconnected |

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

2. **Google Drive Sync**
   - Stores thoughts in a single Markdown file (`ignite-thoughts.md`)
   - Automatic timestamps for each entry
   - Entries organized by date

3. **PWA Capabilities**
   - Installable on mobile home screen
   - Works offline
   - Auto-updates in background

4. **Offline Support**
   - Queue entries when offline
   - Automatic sync when connection restored
   - Visual indicator for pending entries

5. **Automatic Session Persistence**
   - Silently refreshes Google OAuth token before expiry (5-minute buffer)
   - Re-validates token when a backgrounded tab returns to foreground
   - Falls back to sign-in screen if the Google session has expired

### User Flow

```
Open App → (Sign in if needed) → Type thought → Save → Done
```

## Technical Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa (Workbox)
- **Storage**: Google Drive API
- **Offline**: IndexedDB (idb)

### Data Format

Thoughts are stored as Markdown in Google Drive:

```markdown
# Ignite Thoughts

---

## 2026-01-26

### 09:15 AM
First thought of the day captured here.

---

### 02:30 PM
Another idea that came to mind.

---
```

## Visual Design

### Color Palette

**Fire & Flame Theme** - Warm, energetic colors that embody the "ignited" concept

| Role | Color | Hex |
|------|-------|-----|
| Primary/Accent | Flame Orange | `#ff6b35` |
| Accent Hover | Light Orange Glow | `#ff8956` |
| Background Primary | Deep Charcoal | `#1a0f0a` |
| Background Secondary | Warm Dark Brown | `#2a1810` |
| Background Tertiary | Ember Glow | `#3d2416` |
| Text Primary | Firelight Cream | `#ffecd1` |
| Text Secondary | Warm Bronze | `#d4a574` |
| Success | Warm Amber | `#ffa726` |
| Error | Ember Red | `#ff5252` |
| Warning | Golden Flame | `#ffb300` |

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
