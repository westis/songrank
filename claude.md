# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SongRank is a pairwise-comparison song ranking app using Whole-History Rating (WHR) algorithms. Users battle songs head-to-head to produce statistically reliable rankings across an artist's catalog, with Spotify integration for playback during battles.

The initial use case is ranking Midnight Oil's complete discography (~150 songs). Supports multi-user collaboration with controversy tracking.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 + TypeScript
- **Bundler:** Turbopack (built into Next.js)
- **Styling:** Tailwind CSS 4.1 (uses `@import "tailwindcss"` in globals.css, CSS variables for theming)
- **State:** React Query (@tanstack/react-query) for server state, Zustand for client state
- **Database:** Supabase PostgreSQL with Row-Level Security (RLS)
- **Auth:** Supabase Auth
- **API:** Direct Supabase client access + Next.js Route Handlers (for WHR calculation)
- **Deployment:** Vercel (auto-deploy on git push)

## Common Commands

```bash
npm run dev          # Local development at localhost:3000
npm run build        # Production build
npm start            # Start production server
```

## Environment Variables

Required in `.env.local` for local development:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SPOTIFY_CLIENT_ID
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is secret and server-only (used in Route Handlers). Never expose it to the client.

## Architecture

### Rating System (Hybrid)

Two algorithms work together:
1. **Elo (client-side)** -- instant feedback after each battle. Implemented in `src/lib/elo.ts`. K-factor adjusted by confidence level (coin_flip=0.5x, slight=0.8x, clear=1.0x, obvious=1.5x).
2. **WHR (server-side)** -- accurate retroactive recalculation via `/api/calculate-whr` Route Handler. Triggered automatically after 20+ battles since last WHR, on session completion, or manually. Uses service role key for full DB access.

Rankings show a "freshness" indicator and a manual recalculate button.

### Database Schema

Core tables: `projects`, `project_collaborators`, `songs`, `battle_sessions`, `battles`, `ratings`, `whr_calculations`. All tables use RLS policies scoped to project ownership or collaboration. Songs are deduplicated by ISRC. Ratings use a composite unique constraint on `(project_id, song_id, user_id)`.

Auth is handled by Supabase (`auth.users`); reference `auth.uid()` in RLS policies.

### Key Data Flows

- **Battle flow:** User picks winner -> save battle to Supabase -> Elo update (client) -> check WHR trigger (20+ battles since last) -> optional async WHR recalculation
- **Song import:** Search Spotify API for artist -> select albums -> fetch tracks -> deduplicate by ISRC -> store in `songs` table
- **Spotify playback:** Web Playback SDK (requires Premium) with three modes: Instant (no playback), Quick Sample (30s), Full Listen

### Battle Sessions

Pre-configured session types: Album Round-Robin, Division, Smart AI, Cross-Album. Sessions track progress (battles_completed/battles_total), can be paused/resumed, and auto-trigger WHR on completion.

### Multi-User

Projects are shared via invite links. Each user gets personal ratings. Consensus rankings use a weighted algorithm. Controversy detection finds songs with the biggest rating disagreements between collaborators.

## Frontend Aesthetic Guidelines

Avoid the "AI slop" aesthetic. Specific rules from `design.md`:
- **Typography:** Choose distinctive, beautiful fonts. Avoid Inter, Roboto, Arial, Space Grotesk, and system fonts.
- **Color:** Commit to a cohesive palette using CSS variables. Dominant colors with sharp accents. Avoid purple gradients on white.
- **Motion:** Use CSS-only animations where possible; Motion library for React when needed. Prioritize one well-orchestrated page load with staggered reveals over scattered micro-interactions.
- **Backgrounds:** Layer CSS gradients, geometric patterns, or contextual effects. No flat solid colors.
- Vary between light/dark themes. Make unexpected choices that feel designed for this specific context.

## Constraints and Decisions

- Spotify-only for MVP (no Apple Music, YouTube Music)
- Web-responsive only, no native mobile app
- Privacy-first: no public sharing of rankings
- Max 10% of battles can be draws
- Draws are stored as `winner_id IS NULL` in the battles table
- Free-tier friendly: Supabase free (500MB DB), Vercel hobby, Spotify API free for non-commercial use
