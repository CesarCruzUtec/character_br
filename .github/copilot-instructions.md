# Project: Character Battle Royale

## Overview
Next.js 16 app implementing a single-elimination tournament bracket for characters. Users provide a Pastebin ID containing a JSON roster, then vote on head-to-head matchups until a champion emerges. Supports audio playback (direct files + YouTube), save/load slots, and animated transitions.

## Tech Stack
- **Framework**: Next.js 16.2.3 (App Router, `src/app/` directory)
- **Language**: TypeScript 5 (strict mode, `@/*` path alias → `./src/*`)
- **UI**: React 19.2.4, Tailwind CSS 4, Framer Motion 12
- **Audio**: Howler.js 2.2 (direct files), YouTube IFrame Player API (YouTube URLs)
- **Validation**: Zod 4.3
- **Linting**: ESLint 9 with `eslint-config-next`

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # Type-check without emitting
```

## Directory Structure
```
src/
  app/
    page.tsx              # Home page: Pastebin ID input, start tournament, load saved runs
    layout.tsx            # Root layout: fonts, TournamentProvider wrapper
    globals.css           # Global styles, CSS variables (--font-display, etc.)
    api/
      fetch-roster/
        route.ts          # GET /api/fetch-roster?id=... → fetches Pastebin raw, validates with Zod
    tournament/
      page.tsx            # Tournament page: match UI, split-screen cards, sorting animation
    summary/
      page.tsx            # Summary page: bracket results, winner display
  components/
    TournamentProvider.tsx # Context provider: all tournament state, persistence, save/load
    MatchCard.tsx          # Single character card in a matchup (image cycling, hover, vote)
    SortingAnimation.tsx   # Animated overlay when shuffling characters into next round
    HoverInfoCard.tsx      # Floating card showing character description on hover
    BracketSummary.tsx     # Final bracket visualization on summary page
    SaveMenu.tsx           # Modal: save current state (new/overwrite) or load existing saves
    LoadPanel.tsx          # Modal on home page: list all saves grouped by pastebin ID, import/export
  hooks/
    useAudioController.ts  # Manages Howler + YouTube player instances, fade in/out, preloading
  lib/
    types.ts              # Zod schemas (CharacterSchema, RosterSchema), TS types (Match, Round, etc.)
    store.ts              # TournamentStore interface, SaveSlot type, useTournament() hook
    bracket.ts            # Bracket logic: shuffle, createFirstRound, createNextRound, getRoundLosers
    saves.ts              # localStorage CRUD for save slots, export/import JSON, download
    youtube.ts            # YouTube URL parsing, video ID extraction
```

## Key Data Types (src/lib/types.ts)
- `Character`: `{ id: string|number, name: string, description: string, images: string[], music?: string }`
- `Match`: `{ id: string, character1: Character, character2: Character|null, winner: Character|null }`
- `Round`: `{ roundNumber: number, name: string, matches: Match[] }`
- `SaveSlot` (src/lib/store.ts): `{ id, name, pastebinId, savedAt, roster, rounds, currentRoundIndex, currentMatchIndex, isComplete, winner, losersByRound }`

## State Management
- All state lives in `TournamentProvider` (React Context + useState)
- Active tournament auto-persists to `localStorage["tournament_state"]` via useEffect
- Save slots stored separately in `localStorage["tournament_saves"]` (array of SaveSlot)
- Hydration safety: state initializes empty, loads from localStorage in useEffect, `isHydrated` flag gates routing decisions

## Roster Input Format
Pastebin must contain JSON array validated by `RosterSchema`:
```json
[
  {
    "id": "char1",
    "name": "Character Name",
    "description": "Short description",
    "images": ["https://url1.png", "https://url2.png"],
    "music": "https://youtube.com/watch?v=..." // optional
  }
]
```
Minimum 2 characters required. `images` array must have at least 1 URL.

## Audio System (src/hooks/useAudioController.ts)
- Detects YouTube URLs vs direct audio URLs
- YouTube: creates hidden iframe players via YouTube IFrame API, fades volume 0→100
- Direct audio: uses Howler.js with fade-in/fade-out
- One audio plays at a time; switching characters stops previous

## Important Patterns
- All pages are `"use client"` components
- `useTournament()` hook provides access to all state and actions
- `isHydrated` must be checked before any routing logic that depends on persisted state
- Match cards cycle through character images on a timer
- Sorting animation plays between rounds (Framer Motion)
- `currentPastebinId` tracks which roster a save belongs to

## Styling
- Tailwind CSS 4 with PostCSS
- Dark theme: `bg-[#09090b]`, zinc color palette
- Accent color: `#d4a853` (gold)
- Font variables: `--font-display`, `--font-sans`, `--font-geist-sans`, `--font-geist-mono`
- Images are unoptimized (`next.config.ts: images.unoptimized = true`)
