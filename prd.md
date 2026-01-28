# Product Requirements Document: Universal Song Ranking System

**Version:** 2.0  
**Date:** January 27, 2026  
**Author:** Daniel  
**Status:** Ready for Development

---

## 1. Executive Summary

### 1.1 Product Vision

A sophisticated song ranking application that uses pairwise comparison battles and Whole-History Rating (WHR) algorithms to create statistically reliable, personalized rankings of songs across any artist's catalog. The system supports flexible battle formats (album-based, league divisions, cross-artist), multi-user collaboration, and intelligent battle suggestion algorithms.

### 1.2 Target Users

- **Primary:** Music enthusiasts who want to systematically rank large catalogs (100+ songs)
- **Secondary:** Friend groups who want collaborative rankings with disagreement tracking
- **Initial Use Case:** Ranking Midnight Oil's complete discography (~150 songs), expandable to Bruce Springsteen (~350 songs) and beyond

### 1.3 Key Differentiators

- **Whole-History Rating** for retroactive calibration (not just forward-only Elo/Glicko)
- **Unified rating pool** across albums/artists with flexible filtering
- **Hybrid battle modes** (instant decision, quick sample, full listen)
- **League/division structures** for long-term engagement
- **Multi-user controversy tracking** for collaborative rankings
- **Spotify integration** for seamless playback during battles

---

## 2. Goals and Success Metrics

### 2.1 Product Goals

1. Enable reliable ranking of 100+ songs with <500 battles per user
2. Support both solo and collaborative ranking workflows
3. Provide engaging, game-like experience that sustains interest over weeks/months
4. Generate statistically valid ratings with quantified uncertainty
5. Make music discovery fun through systematic comparison

### 2.2 Success Metrics

**Engagement:**

- Average battles per user per session: >15
- Session frequency: 3+ times per week during active ranking
- Time to first complete album ranking: <2 weeks
- User retention through first "Champions League" phase: >80%

**Quality:**

- Rating convergence: 90% of songs with RD <100 after album completion
- Cross-album calibration: 80% accuracy in predicting user preferences after 100 cross-album battles
- User satisfaction with final rankings: >8/10 rating

**Technical:**

- WHR recalculation time: <3 seconds for 5,000 battles
- Spotify track matching accuracy: >95%
- Battle page load time: <500ms
- System uptime: >99.5%

---

## 3. User Stories

### 3.1 Core User Stories

**As a solo ranker, I want to:**

- Battle songs from a single album to get album rankings
- Battle across albums to create artist-wide rankings
- Filter rankings by artist, album, era, or custom tags
- See my top 50 songs across all ranked music
- Track which songs need more battles (high uncertainty)
- Choose between instant-decision and full-listen modes
- Pause and resume ranking sessions anytime

**As a collaborative ranker, I want to:**

- Invite a friend to rank the same catalog
- See both individual rankings and consensus rankings
- Identify "controversial" songs where we disagree most
- Focus battle sessions on our biggest disagreements
- Compare our taste profiles across artists/eras

**As a power user, I want to:**

- Create custom battle sessions (e.g., "all opening tracks")
- Run league divisions with promotion/relegation
- Import songs from multiple artists into unified rankings
- Export rankings to CSV or Spotify playlists
- See statistical details (rating, RD, battle count per song)

### 3.2 Anti-User Stories (Out of Scope for MVP)

**We will NOT support:**

- Public sharing of rankings (privacy-first, personal tool)
- Social features beyond 1-2 friend collaboration
- Automated playlist generation based on rankings (future feature)
- Integration with Apple Music, YouTube Music, etc. (Spotify only for MVP)
- Mobile native app (web-responsive only for MVP)

---

## 4. Features and Requirements

### 4.1 Core Features

#### 4.1.1 Artist & Album Setup

**Requirements:**

- Search Spotify for artist by name
- Display all studio albums + compilation albums
- Select which albums to include in ranking pool
- Automatically fetch all tracks from selected albums
- Manual override: add/remove specific songs
- Tag songs with metadata: album, year, era, genre
- Support custom eras (e.g., "Imperial Phase 1987-1993")

**Acceptance Criteria:**

- User can import Midnight Oil's 13 studio albums in <2 minutes
- System correctly identifies and imports 150+ songs
- Duplicate songs across albums are deduplicated by ISRC
- Album artwork displays correctly

#### 4.1.2 Battle Interface

**Requirements:**

- Display two songs side-by-side with album art
- Show song metadata: title, album, year, duration
- Playback controls integrated with Spotify Web Player
- Three decision modes:
  - **Instant:** Click winner without listening (2-second skip-ahead confirmation)
  - **Quick Sample:** Play 30-second preview from both songs
  - **Full Listen:** Play both songs completely
- Optional confidence voting: Coin Flip / Slight Edge / Clear Winner / Obvious
- Optional draw/tie button (max 10% of battles)
- Keyboard shortcuts: Left arrow = Song A, Right arrow = Song B, Space = Play/Pause, D = Draw
- Progress indicator: "Battle 23 of 66 in Red Sails Season"
- "Skip this battle" option (flagged for later)

**Acceptance Criteria:**

- Battle decision recorded in <1 second after user click
- Spotify playback starts in <2 seconds
- Keyboard shortcuts work 100% reliably
- Progress saves automatically (no lost battles on browser close)

#### 4.1.3 Battle Session Management

**Requirements:**

- Pre-configured session types:
  - **Album Round-Robin:** 40-66 battles (configurable rounds)
  - **Division Full Season:** All pairwise combinations
  - **Smart AI Selection:** N battles targeting high-uncertainty songs
  - **Cross-Album Sampler:** N random cross-album battles
  - **Manual Selection:** User picks specific songs to battle
- Session creation wizard:
  - Step 1: Choose session type
  - Step 2: Select songs/albums
  - Step 3: Configure parameters (rounds, battle count)
  - Step 4: Name session (optional)
- In-session controls:
  - Pause/resume anytime
  - Session progress dashboard
  - Estimated time remaining
  - End session early (ratings still update)

**Acceptance Criteria:**

- User can create and start album session in <30 seconds
- Session state persists across browser sessions
- Multiple concurrent sessions supported (e.g., album + cross-album)

#### 4.1.4 Ranking Display

**Requirements:**

- Default view: All songs ranked by rating (descending)
- Filters:
  - Artist(s)
  - Album(s)
  - Era/year range
  - Battle count (e.g., "show only songs with 5+ battles")
  - Uncertainty threshold (e.g., "show only RD >100")
- Display columns:
  - Rank #
  - Song title
  - Artist
  - Album
  - Rating (with ± RD)
  - Battle count
  - Last battled date
- Song detail view:
  - Battle history (all battles involving this song)
  - Rating evolution chart over time
  - Win/loss record
  - Average opponent rating
- Export options:
  - CSV download
  - Create Spotify playlist from top N songs
- Rating freshness indicator: "Last updated 5 minutes ago (23 battles since)"
- Manual "Recalculate with WHR" button

**Acceptance Criteria:**

- Rankings update within 2 seconds of battle completion (Elo approximation)
- Filters work instantly (<100ms)
- Song detail view shows complete battle history
- Spotify playlist export works for up to 500 songs
- Freshness indicator accurately reflects data staleness

#### 4.1.5 Multi-User Collaboration

**Requirements:**

- Invite flow:
  - Generate unique invite link
  - Friend creates account / logs in
  - Friend automatically joins collaborative ranking project
- Per-user features:
  - Personal rankings (user's battles only)
  - Consensus rankings (combined algorithm)
  - Controversy view: Songs with biggest rating disagreements
- Consensus algorithm:
  - Weighted average based on rating confidence
  - When users agree: High confidence, large rating movement
  - When users disagree: Low confidence, small rating movement, flag as controversial
- Collaborative battle sessions:
  - Battle independently, results merge automatically

**Acceptance Criteria:**

- Friend can join and start battling in <3 minutes
- Controversy scores correctly identify biggest disagreements
- Consensus ratings reflect appropriate uncertainty when users disagree

---

### 4.2 Advanced Features (Post-MVP)

#### 4.2.1 League/Division System

- Seed songs into 12-song divisions based on initial album rankings
- Run full round-robin seasons (66 battles per division)
- Promotion/relegation after each season
- Championship playoffs for top division

#### 4.2.2 AI Battle Suggestions

- Daily "Quick 5": Five smart battles based on uncertainty
- "Upset Alert": Low-ranked songs vs high-ranked songs (to catch underrated gems)
- "Settle This": Suggest battles for songs within 50 rating points
- "Cross-Pollination": Suggest cross-artist battles to calibrate catalogs

#### 4.2.3 Analytics Dashboard

- Taste profile: Which eras/albums you rate highest
- Battle velocity: Battles per day/week
- Confidence analysis: How often you use each confidence level
- Prediction accuracy: How well WHR predicts your future choices

---

## 5. Technical Architecture

### 5.1 Technology Stack

**Frontend:**

- **Framework:** Next.js 16.1.5 (App Router) with React 19 + TypeScript
- **Bundler:** Turbopack (built into Next.js)
- **Styling:** Tailwind CSS 4.1
- **State Management:** React Query + Zustand
- **Deployment:** Vercel (existing subscription)

**Backend:**

- **Database:** Supabase PostgreSQL (existing subscription)
- **Authentication:** Supabase Auth (built-in)
- **API Routes:** Next.js Route Handlers (for WHR calculation only)
- **API:** Direct Supabase client access + Route Handlers for WHR

**Third-Party Services:**

- **Spotify:** Web Playback SDK + Spotify Web API
- **Analytics:** PostHog or Plausible (privacy-first)

**Why This Stack:**

- ✅ Zero cost (free tiers + existing subscriptions)
- ✅ No separate backend server needed (Supabase handles most logic, Next.js API routes for WHR)
- ✅ Auto-deployment (git push → live in 30 seconds via Vercel)
- ✅ Friend can access immediately (just share URL)
- ✅ Scales automatically

### 5.2 System Architecture

```
┌─────────────────────────────────────────────────┐
│      Next.js 16 App (React 19 + TypeScript)    │
│              Deployed on Vercel                 │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Battle UI    │  │ Rankings     │            │
│  │ (Client)     │  │ Dashboard    │            │
│  └──────────────┘  └──────────────┘            │
│           │                │                    │
│           └────────┬───────┘                    │
│                    │                            │
│  ┌─────────────────▼──────────────────────┐    │
│  │ Supabase Client  │  Next.js Route      │    │
│  │ SDK (Direct)     │  Handlers (/api/*)  │    │
│  └─────────────────┬──────────────────────┘    │
└────────────────────┼─────────────────────────────┘
                     │ HTTPS
         ┌───────────▼──────────┐
         │   Supabase Backend   │
         │   (Fully Managed)    │
         │                      │
         │  ┌────────────────┐  │
         │  │ PostgreSQL DB  │  │
         │  │ + Auth         │  │
         │  │ + Row Level    │  │
         │  │   Security     │  │
         │  └────────────────┘  │
         └──────────────────────┘

    ┌──────────────────────────┐
    │ Next.js Route Handler    │
    │                          │
    │  /api/calculate-whr      │
    │  (WHR computation only)  │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │   Spotify Web API        │
    │                          │
    │  - Artist Search         │
    │  - Album/Track Metadata  │
    │  - Web Playback SDK      │
    └──────────────────────────┘
```

### 5.3 WHR Calculation Strategy

**Hybrid Approach (Best of Both Worlds):**

```
After Each Battle:
├── 1. Save battle to Supabase (instant)
├── 2. Apply quick Elo update (client-side, approximate)
│      → Rankings update immediately
└── 3. Check: Should trigger full WHR?
       ├── YES if: 20+ battles since last WHR OR session completed
       │   └── Trigger /api/calculate-whr (async, 2-3 seconds)
       └── NO: Wait for more battles

User Views Rankings:
├── Show current ratings (Elo + last WHR basis)
├── Show freshness: "Last updated 5 min ago (23 battles since)"
└── Manual button: "⟳ Recalculate with WHR" (for immediate update)
```

**Why Hybrid:**

- ✅ Instant feedback after each battle (Elo)
- ✅ Accurate ratings without waste (WHR every 20 battles)
- ✅ User control (manual recalc button always available)
- ✅ No surprises (user sees when data is stale)

**Not Using:**

- ❌ WHR after every battle (wasteful, 90% produce tiny changes)
- ❌ Manual-only (users forget to recalculate)
- ❌ Nightly batch (battles feel disconnected from ratings)

### 5.4 Performance Requirements

**Response Times:**

- Battle submission → Elo update: <1 second
- WHR recalculation (5,000 battles): <3 seconds
- Rankings page load: <500ms
- Battle interface render: <200ms
- Spotify track playback start: <2 seconds

**Scalability:**

- Support 10,000 songs per user project
- Support 50,000 battles per user project
- Support 10 concurrent users per collaborative project
- Database should handle 1,000 users (MVP scale)

**Availability:**

- 99.5% uptime (MVP acceptable)
- Graceful degradation when Spotify API unavailable
- Local state persistence if backend unreachable

---

## 6. Spotify Integration

### 6.1 Authentication Flow

**Requirements:**

- Use Spotify OAuth 2.0 authorization code flow
- Required scopes:
  - `user-read-email` - Get user email
  - `user-read-private` - Get user profile
  - `streaming` - Web Playback SDK
  - `user-read-playback-state` - Check playback state
  - `user-modify-playback-state` - Control playback
- Token refresh handling (tokens expire after 1 hour)
- Fallback for users without Spotify Premium (show "Upgrade Required" message)

**User Flow:**

1. User clicks "Connect Spotify"
2. Redirect to Spotify authorization page
3. User approves permissions
4. Redirect back to app with auth code
5. Exchange auth code for access token + refresh token
6. Store tokens securely (encrypted in Supabase)
7. Initialize Spotify Web Playback SDK

**Technical Details:**

```javascript
// Spotify OAuth endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Required parameters
const params = {
  client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  response_type: "code",
  redirect_uri: "https://songrank.vercel.app/callback",
  scope:
    "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state",
  show_dialog: true,
};
```

### 6.2 Artist & Album Import

**API Endpoints Used:**

- `GET /v1/search?type=artist&q={name}` - Search for artist
- `GET /v1/artists/{id}/albums` - Get artist's albums
- `GET /v1/albums/{id}/tracks` - Get album tracks
- `GET /v1/tracks/{id}` - Get track details

**Import Flow:**

1. User searches for artist name
2. Display top 5 artist matches with images
3. User selects correct artist
4. Fetch all albums (filter: `album_type=album,compilation`)
5. Display album grid with checkboxes
6. User selects albums to import
7. For each album, fetch all tracks
8. Store in database with Spotify URIs

**Data Mapping:**

```javascript
// Song entity from Spotify track
{
  id: uuid(),
  title: track.name,
  artist: track.artists[0].name,
  album: track.album.name,
  album_id: track.album.id,
  year: parseInt(track.album.release_date.slice(0, 4)),
  duration_ms: track.duration_ms,
  spotify_uri: track.uri,
  spotify_id: track.id,
  spotify_preview_url: track.preview_url, // 30-sec preview
  isrc: track.external_ids.isrc, // For deduplication
  track_number: track.track_number,
  disc_number: track.disc_number,
  album_artwork_url: track.album.images[0].url
}
```

**Deduplication Strategy:**

- Use ISRC (International Standard Recording Code) as primary dedup key
- If song appears on multiple albums (e.g., "greatest hits"), keep only first instance
- Provide manual override: "Include duplicates from different albums"

### 6.3 Playback Integration

**Web Playback SDK:**

```javascript
// Initialize player
const player = new Spotify.Player({
  name: "Song Ranking Battle Player",
  getOAuthToken: (cb) => {
    cb(accessToken);
  },
  volume: 0.8,
});

// Connect to player
player.connect().then((success) => {
  if (success) {
    console.log("Spotify Player ready");
  }
});

// Play track
const playTrack = async (spotifyUri, positionMs = 0) => {
  await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        uris: [spotifyUri],
        position_ms: positionMs,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
};
```

**Battle Playback Modes:**

**1. Instant Decision Mode:**

- No playback required
- Option to play 5-second confirmation snippet after decision
- Track: `playTrack(winnerUri, 0)` for 5 seconds

**2. Quick Sample Mode:**

- Play 30-second preview for each song
- Use Spotify preview URLs (pre-generated by Spotify)
- If preview not available, play from track midpoint

```javascript
const playSample = async (song) => {
  if (song.spotify_preview_url) {
    // Use HTML5 audio for preview URL (no Spotify Premium required!)
    audioElement.src = song.spotify_preview_url;
    audioElement.play();
  } else {
    // Fallback: play from midpoint using Web Playback SDK
    const midpoint = Math.floor(song.duration_ms / 2);
    await playTrack(song.spotify_uri, midpoint);
    setTimeout(() => player.pause(), 30000);
  }
};
```

**3. Full Listen Mode:**

- Play both songs completely
- Show playback progress bar
- Allow skip forward/backward
- Resume from last position if user pauses

**Playback Controls:**

```javascript
// Play/Pause toggle
player.togglePlay();

// Seek to position
player.seek(positionMs);

// Volume control
player.setVolume(0.5); // 0.0 to 1.0

// Get current state
player.getCurrentState().then((state) => {
  console.log("Currently playing:", state.track_window.current_track);
  console.log("Position:", state.position);
  console.log("Duration:", state.duration);
});
```

### 6.4 Error Handling

**Common Errors:**

- **Token expired:** Automatically refresh token and retry
- **No active device:** Prompt user to "Click here to activate player"
- **Track unavailable:** Show message "Song not available in your region"
- **Premium required:** Show upgrade prompt
- **Network error:** Show "Playback failed, try again"

**Graceful Degradation:**

- If Spotify Web Playback SDK fails, fallback to preview URLs (30-sec only)
- If preview URLs unavailable, show "Playback unavailable - make decision based on memory"
- Battle can still proceed without playback (instant decision mode)

### 6.5 Rate Limiting

**Spotify API Limits:**

- 429 response → Retry after delay specified in `Retry-After` header
- Implement exponential backoff: 1s, 2s, 4s, 8s
- Cache album/track metadata aggressively (1 week TTL)
- Batch API calls where possible

---

## 7. Data Model

### 7.1 Database Schema (Supabase PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Supabase Auth handles users table automatically
-- Reference: auth.users(id) for foreign keys

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators
CREATE TABLE project_collaborators (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'collaborator', -- 'owner' or 'collaborator'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    album_id TEXT,
    year INTEGER,
    era TEXT,
    duration_ms INTEGER,
    spotify_uri TEXT NOT NULL,
    spotify_id TEXT NOT NULL,
    spotify_preview_url TEXT,
    isrc TEXT,
    track_number INTEGER,
    disc_number INTEGER,
    album_artwork_url TEXT,
    custom_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, spotify_id)
);

-- Battle sessions
CREATE TABLE battle_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    config JSONB,
    status TEXT DEFAULT 'active',
    battles_completed INTEGER DEFAULT 0,
    battles_total INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battles table
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES battle_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_a_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    song_b_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    confidence TEXT,
    listen_mode TEXT,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (song_a_id != song_b_id),
    CHECK (winner_id IN (song_a_id, song_b_id) OR winner_id IS NULL)
);

-- Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating FLOAT NOT NULL DEFAULT 1500,
    rd FLOAT NOT NULL DEFAULT 350,
    battle_count INTEGER DEFAULT 0,
    algorithm TEXT DEFAULT 'elo',
    last_battle_at TIMESTAMP WITH TIME ZONE,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, song_id, user_id)
);

-- WHR calculation metadata
CREATE TABLE whr_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    battles_processed INTEGER NOT NULL,
    songs_updated INTEGER NOT NULL,
    calculation_time_ms INTEGER,
    triggered_by TEXT, -- 'auto', 'manual', 'session_complete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_songs_project ON songs(project_id);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_album ON songs(album);
CREATE INDEX idx_songs_spotify_id ON songs(spotify_id);
CREATE INDEX idx_battles_project_user ON battles(project_id, user_id);
CREATE INDEX idx_battles_session ON battles(session_id);
CREATE INDEX idx_battles_songs ON battles(song_a_id, song_b_id);
CREATE INDEX idx_battles_created ON battles(created_at DESC);
CREATE INDEX idx_ratings_project_user ON ratings(project_id, user_id);
CREATE INDEX idx_ratings_song ON ratings(song_id);
CREATE INDEX idx_ratings_rating ON ratings(rating DESC);
CREATE INDEX idx_whr_project ON whr_calculations(project_id);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT project_id FROM project_collaborators
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for Songs
CREATE POLICY "Users can view songs in accessible projects" ON songs
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create songs in own projects" ON songs
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- RLS Policies for Battles
CREATE POLICY "Users can view battles in accessible projects" ON battles
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create battles in accessible projects" ON battles
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for Ratings
CREATE POLICY "Users can view ratings in accessible projects" ON ratings
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can update ratings" ON ratings
    FOR ALL USING (true); -- Allow serverless function to update

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7.2 Sample Data

```sql
-- Example: Midnight Oil project
INSERT INTO projects (id, owner_id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'user-uuid-here', 'Midnight Oil Complete Ranking', 'Ranking all 150+ songs');

-- Example: Songs from Red Sails in the Sunset
INSERT INTO songs (project_id, title, artist, album, year, spotify_uri, spotify_id, duration_ms) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Best of Both Worlds', 'Midnight Oil', 'Red Sails in the Sunset', 1984, 'spotify:track:abc123', 'abc123', 222000),
('550e8400-e29b-41d4-a716-446655440000', 'Sleep', 'Midnight Oil', 'Red Sails in the Sunset', 1984, 'spotify:track:def456', 'def456', 327000);

-- Example: Battle session
INSERT INTO battle_sessions (project_id, user_id, name, session_type, battles_total, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'user-uuid-here', 'Red Sails Round-Robin', 'album', 66, 'active');

-- Example: Battle
INSERT INTO battles (project_id, user_id, song_a_id, song_b_id, winner_id, confidence, listen_mode) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'user-uuid-here', 'song-a-uuid', 'song-b-uuid', 'song-a-uuid', 'clear', 'quick_sample');

-- Example: Rating
INSERT INTO ratings (project_id, song_id, user_id, rating, rd, battle_count, algorithm) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'song-a-uuid', 'user-uuid-here', 1847, 65, 12, 'whr');
```

---

## 8. Rating Algorithms

### 8.1 Quick Elo Update (Client-Side)

**Purpose:** Provide instant feedback after each battle

```javascript
// src/lib/elo.ts
export function updateEloRatings(
  ratingA: number,
  ratingB: number,
  winnerId: 'A' | 'B' | 'draw',
  confidence: 'coin_flip' | 'slight' | 'clear' | 'obvious' = 'clear'
): { newRatingA: number; newRatingB: number } {

  const K_BASE = 32;

  // Adjust K-factor based on confidence
  const K_MULTIPLIERS = {
    coin_flip: 0.5,
    slight: 0.8,
    clear: 1.0,
    obvious: 1.5
  };

  const K = K_BASE * K_MULTIPLIERS[confidence];

  // Expected outcome (logistic function)
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

  // Actual outcome
  const actualA = winnerId === 'A' ? 1 : winnerId === 'B' ? 0 : 0.5;

  // Calculate adjustments
  const adjustmentA = K * (actualA - expectedA);
  const adjustmentB = -adjustmentA;

  return {
    newRatingA: ratingA + adjustmentA,
    newRatingB: ratingB + adjustmentB
  };
}

// Usage after battle
async function onBattleComplete(songA, songB, winner, confidence) {
  // 1. Save battle to Supabase
  await supabase.from('battles').insert({...});

  // 2. Quick Elo update (instant)
  const { newRatingA, newRatingB } = updateEloRatings(
    songA.rating,
    songB.rating,
    winner === songA.id ? 'A' : 'B',
    confidence
  );

  // 3. Update ratings in Supabase
  await supabase.from('ratings').upsert([
    { song_id: songA.id, rating: newRatingA, algorithm: 'elo', ... },
    { song_id: songB.id, rating: newRatingB, algorithm: 'elo', ... }
  ]);

  // 4. Check if WHR should trigger
  await checkWHRTrigger(projectId);
}
```

### 8.2 Whole-History Rating (Server-Side)

**Purpose:** Accurate, retroactive rating calculation

```typescript
// app/api/calculate-whr/route.ts (Next.js Route Handler)
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

interface Battle {
  id: string;
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null;
  confidence: string | null;
  created_at: string;
}

interface Song {
  id: string;
  title: string;
}

interface WHRResult {
  rating: number;
  rd: number;
  battle_count: number;
}

export async function POST(request: NextRequest) {
  const { projectId, userId, trigger } = await request.json();

  // Create Supabase client with service role key (full access)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const startTime = Date.now();

  // 1. Fetch all battles and songs for this project/user
  const { data: battles, error: battlesError } = await supabase
    .from("battles")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (battlesError) {
    return Response.json({ error: battlesError.message }, { status: 500 });
  }

  const { data: songs, error: songsError } = await supabase
    .from("songs")
    .select("id, title")
    .eq("project_id", projectId);

  if (songsError) {
    return Response.json({ error: songsError.message }, { status: 500 });
  }

  // 2. Run WHR algorithm
  const whrResults = computeWHR(battles, songs);

  // 3. Update ratings in database
  const ratingUpdates = Object.entries(whrResults).map(([songId, result]) => ({
    project_id: projectId,
    song_id: songId,
    user_id: userId,
    rating: result.rating,
    rd: result.rd,
    battle_count: result.battle_count,
    algorithm: "whr",
    computed_at: new Date().toISOString(),
  }));

  const { error: updateError } = await supabase
    .from("ratings")
    .upsert(ratingUpdates, { onConflict: "project_id,song_id,user_id" });

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  // 4. Record WHR calculation metadata
  const calculationTime = Date.now() - startTime;
  await supabase.from("whr_calculations").insert({
    project_id: projectId,
    user_id: userId,
    battles_processed: battles.length,
    songs_updated: Object.keys(whrResults).length,
    calculation_time_ms: calculationTime,
    triggered_by: trigger || "manual",
  });

  return Response.json({
    success: true,
    songsUpdated: Object.keys(whrResults).length,
    battlesProcessed: battles.length,
    calculationTimeMs: calculationTime,
  });
}

function computeWHR(
  battles: Battle[],
  songs: Song[],
  iterations: number = 10,
): Record<string, WHRResult> {
  // Initialize ratings
  const ratings: Record<string, number> = {};
  const battleCounts: Record<string, number> = {};

  for (const song of songs) {
    ratings[song.id] = 1500.0;
    battleCounts[song.id] = 0;
  }

  const K_FACTOR = 32;

  // Iterate until convergence
  for (let iteration = 0; iteration < iterations; iteration++) {
    const ratingChanges: Record<string, number> = {};

    for (const song of songs) {
      ratingChanges[song.id] = 0;
    }

    for (const battle of battles) {
      const { song_a_id, song_b_id, winner_id, confidence } = battle;

      // Skip if draw (handle separately if needed)
      if (!winner_id) continue;

      const r_a = ratings[song_a_id];
      const r_b = ratings[song_b_id];

      // Expected outcome (logistic function)
      const expected_a = 1.0 / (1.0 + Math.pow(10, (r_b - r_a) / 400));

      // Actual outcome
      const actual_a = winner_id === song_a_id ? 1.0 : 0.0;

      // Apply confidence weighting
      let k = K_FACTOR;
      if (confidence === "coin_flip") k *= 0.5;
      else if (confidence === "obvious") k *= 1.5;

      // Compute adjustment
      const adjustment = k * (actual_a - expected_a);

      ratingChanges[song_a_id] += adjustment;
      ratingChanges[song_b_id] -= adjustment;
    }

    // Apply accumulated changes
    for (const songId in ratingChanges) {
      ratings[songId] += ratingChanges[songId];
    }
  }

  // Count battles per song
  for (const battle of battles) {
    battleCounts[battle.song_a_id] = (battleCounts[battle.song_a_id] || 0) + 1;
    battleCounts[battle.song_b_id] = (battleCounts[battle.song_b_id] || 0) + 1;
  }

  // Calculate rating deviations
  const results: Record<string, WHRResult> = {};
  for (const song of songs) {
    const battleCount = battleCounts[song.id] || 0;

    let rd: number;
    if (battleCount === 0) rd = 350;
    else if (battleCount < 5) rd = 250;
    else if (battleCount < 10) rd = 150;
    else if (battleCount < 20) rd = 100;
    else rd = Math.max(50, 350 / Math.sqrt(battleCount));

    results[song.id] = {
      rating: ratings[song.id],
      rd,
      battle_count: battleCount,
    };
  }

  return results;
}
```

### 8.3 WHR Trigger Logic (Client-Side)

```typescript
// src/lib/whr-trigger.ts
export async function checkWHRTrigger(projectId: string, userId: string) {
  // Get last WHR calculation
  const { data: lastWHR } = await supabase
    .from("whr_calculations")
    .select("created_at, battles_processed")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get total battles count
  const { count: totalBattles } = await supabase
    .from("battles")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  const battlesSinceLastWHR = lastWHR
    ? totalBattles - lastWHR.battles_processed
    : totalBattles;

  // Trigger if 20+ new battles
  if (battlesSinceLastWHR >= 20) {
    await triggerWHRCalculation(projectId, userId, "auto");
  }
}

async function triggerWHRCalculation(
  projectId: string,
  userId: string,
  trigger: "auto" | "manual" | "session_complete",
) {
  try {
    const response = await fetch("/api/calculate-whr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, userId, trigger }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(
        `WHR updated: ${result.songsUpdated} songs in ${result.calculationTimeMs}ms`,
      );
      // Refresh rankings display
      invalidateRankingsCache();
    }
  } catch (error) {
    console.error("WHR calculation failed:", error);
  }
}
```

---

## 9. UI/UX Design

### 9.1 Information Architecture

```
Home
├── Projects (My Rankings)
│   ├── Create New Project
│   ├── Project List
│   └── Project Detail
│       ├── Overview Dashboard
│       ├── Rankings View
│       │   ├── Filter Controls
│       │   ├── Freshness Indicator
│       │   ├── Manual Recalc Button
│       │   └── Song Detail Modal
│       ├── Battle Sessions
│       │   ├── Active Sessions
│       │   ├── Create New Session
│       │   └── Session Detail → Battle Interface
│       ├── Songs Library
│       │   ├── Import from Spotify
│       │   └── Manage Songs/Albums
│       └── Collaborators (if multi-user)
├── Battle Interface (fullscreen mode)
└── Settings
    ├── Spotify Connection
    ├── Preferences
    └── Account
```

### 9.2 Key Screens

#### 9.2.1 Battle Interface (Core UX)

**Layout:**

```
┌────────────────────────────────────────────────────┐
│  Session: Red Sails Round-Robin   |  Battle 23/66  │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐         ┌─────────────────┐  │
│  │                 │         │                 │  │
│  │   Album Art A   │         │   Album Art B   │  │
│  │                 │         │                 │  │
│  └─────────────────┘         └─────────────────┘  │
│                                                     │
│   Best of Both Worlds          Sleep               │
│   Red Sails in the Sunset      Red Sails...        │
│   1984 • 3:42                  1984 • 5:27         │
│                                                     │
│   [▶ Play Sample]              [▶ Play Sample]     │
│                                                     │
│   ┌─────────────┐             ┌─────────────┐     │
│   │   SELECT    │             │   SELECT    │     │
│   │   WINNER    │             │   WINNER    │     │
│   └─────────────┘             └─────────────┘     │
│                                                     │
│   Confidence:  ○ Coin Flip  ○ Slight  ● Clear  ○ Obvious
│                                                     │
│   [ It's a Draw ]          [ Skip This Battle ]    │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Keyboard Shortcuts Display (Toggle with '?'):**

- ← : Select left song
- → : Select right song
- Space: Play/Pause
- 1-4: Set confidence level
- D: Mark as draw
- S: Skip battle
- ?: Show/hide shortcuts

#### 9.2.2 Rankings Dashboard

**Default View:**

```
┌────────────────────────────────────────────────────┐
│  Midnight Oil Rankings                 [Export ▼]  │
│  Last updated: 5 min ago (23 battles since)        │
│  [⟳ Recalculate with WHR]                          │
├────────────────────────────────────────────────────┤
│  Filters:                                          │
│  Artist: [Midnight Oil ▼]  Album: [All ▼]         │
│  Era: [All ▼]  Min Battles: [5 ▼]                 │
├────────────────────────────────────────────────────┤
│  #  | Song               | Album      | Rating    │
├────────────────────────────────────────────────────┤
│  1  | Beds Are Burning   | Diesel...  | 1923 ± 45 │
│  2  | The Dead Heart     | Diesel...  | 1891 ± 52 │
│  3  | Best of Both...    | Red Sails  | 1847 ± 38 │
│  4  | Sleep              | Red Sails  | 1792 ± 41 │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

**Song Detail Modal (Click on song):**

```
┌────────────────────────────────────────────────────┐
│  Best of Both Worlds                         [×]   │
├────────────────────────────────────────────────────┤
│  Album: Red Sails in the Sunset                    │
│  Rating: 1847 ± 38  |  Battle Count: 12           │
│  Last Battled: 2 days ago                          │
│                                                     │
│  Battle History:                                   │
│  ✓ vs Sleep (won) - 2 days ago                     │
│  ✗ vs Beds Are Burning (lost) - 3 days ago        │
│  ✓ vs Short Memory (won) - 3 days ago             │
│  ...                                               │
│                                                     │
│  [▶ Play on Spotify]  [Battle This Song Again]    │
└────────────────────────────────────────────────────┘
```

#### 9.2.3 Session Creation Wizard

**Step 1: Choose Type**

```
Create New Battle Session

○ Album Round-Robin
  Battle all songs from a single album (recommended for new albums)
  Typical: 40-66 battles

○ Division Full Season
  Every song battles every other song (complete rankings)
  Typical: 66 battles for 12 songs

● Smart AI Battles
  System selects battles to improve rating accuracy
  Typical: 20-50 battles

○ Cross-Album Sampler
  Random battles across multiple albums
  Typical: 30-100 battles

○ Manual Selection
  Choose specific songs to battle

[Next →]
```

**Step 2: Configure (for Smart AI Battles)**

```
Smart AI Battle Session

Number of battles: [20 ▼]  (10, 20, 30, 50, 100)

Focus on:
☑ High uncertainty songs (RD > 100)
☑ Close matchups (within 50 rating points)
□ Cross-album calibration
□ Recent songs (battled in last 7 days)

[← Back]  [Create Session →]
```

### 9.3 Mobile Responsiveness

**Key Adaptations:**

- Battle interface: Stack songs vertically on mobile (<768px)
- Swipe gestures: Swipe right = top song wins, swipe left = bottom song wins
- Tap-and-hold to play sample
- Simplified filters on rankings page (collapsible drawer)
- Bottom navigation bar for main sections
- Touch-optimized button sizes (44px minimum)

---

## 10. Development Phases

### Phase 0: Setup & Infrastructure (Week 1)

**Tasks:**

- [ ] Initialize Next.js 16 + React 19 + TypeScript project (App Router)
- [ ] Set up Supabase project and run database migrations
- [ ] Configure Spotify OAuth (register app, get credentials)
- [ ] Set up Vercel project and link to GitHub
- [ ] Configure environment variables in Vercel
- [ ] Deploy hello world to Vercel

**Deliverable:** Working auth flow + empty project shell deployed to `songrank.vercel.app`

**Environment Variables Needed:**

```env
# Vercel Environment Variables (public, exposed to browser via NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=abc123
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://songrank.vercel.app/callback

# Server-only Variables (Secret, used in Route Handlers)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (secret!)
```

### Phase 1: Core Battle System (Weeks 2-3)

**Tasks:**

- [ ] Supabase auth integration (email/password)
- [ ] Spotify artist/album import flow
- [ ] Song storage in Supabase
- [ ] Basic battle interface (binary choice only, no playback)
- [ ] Battle recording to Supabase
- [ ] Simple Elo rating calculation (client-side)
- [ ] Rankings display page with filters

**Deliverable:** Can import Midnight Oil, battle songs without playback, see Elo rankings

### Phase 2: Spotify Playback (Week 4)

**Tasks:**

- [ ] Spotify OAuth implementation
- [ ] Web Playback SDK integration
- [ ] Quick sample mode (30-sec previews)
- [ ] Full listen mode
- [ ] Playback controls (play/pause, seek)
- [ ] Error handling (no Premium, track unavailable)

**Deliverable:** Seamless listening experience during battles

### Phase 3: WHR Algorithm (Week 5)

**Tasks:**

- [ ] Implement WHR algorithm in Next.js Route Handler
- [ ] WHR trigger logic (auto after 20 battles)
- [ ] Manual "Recalculate" button
- [ ] Freshness indicator on rankings page
- [ ] WHR calculation metadata tracking
- [ ] Performance testing with 1,000+ battles

**Deliverable:** Accurate ratings with retroactive calibration

### Phase 4: Session Management (Week 6)

**Tasks:**

- [ ] Battle session creation wizard
- [ ] Album round-robin generator
- [ ] Smart AI battle generator
- [ ] Session progress tracking
- [ ] Pause/resume sessions
- [ ] Session completion flow (auto-triggers WHR)

**Deliverable:** Structured battle workflows

### Phase 5: Advanced Features (Week 7)

**Tasks:**

- [ ] Confidence voting (coin flip → obvious)
- [ ] Draw/tie option (max 10% enforcement)
- [ ] Instant decision mode
- [ ] Song detail modal with battle history
- [ ] Export to CSV
- [ ] Create Spotify playlist from rankings
- [ ] Keyboard shortcuts

**Deliverable:** Power user features complete

### Phase 6: Multi-User Collaboration (Week 8)

**Tasks:**

- [ ] Project sharing/invites (generate unique link)
- [ ] Supabase RLS policies for shared projects
- [ ] Multi-user battle tracking
- [ ] Consensus rating algorithm
- [ ] Controversy detection and ranking
- [ ] Collaborative rankings view

**Deliverable:** Friend collaboration working end-to-end

### Phase 7: Polish & Launch (Weeks 9-10)

**Tasks:**

- [ ] UI/UX refinement (animations, loading states)
- [ ] Mobile responsive design testing
- [ ] Error handling and edge cases
- [ ] Performance optimization (Next.js Server Components, code splitting)
- [ ] User onboarding flow (tutorial/tooltips)
- [ ] Documentation (README, help page)
- [ ] Bug fixes from testing

**Deliverable:** Production-ready MVP deployed at `songrank.vercel.app`

### Future Phases (Post-MVP)

- League/division system with promotion/relegation
- Advanced analytics dashboard
- Cross-artist battles & unified rankings
- Automated playlist generation based on mood/occasion
- Public profile pages (opt-in sharing)
- Export to other music services

---

## 11. Deployment & Operations

### 11.1 Deployment Workflow

**Initial Setup:**

```bash
# 1. Create Next.js project (includes TypeScript, Tailwind CSS 4.1, ESLint, App Router, Turbopack)
npx create-next-app@latest songrank --yes
cd songrank

# 2. Install additional dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install @tanstack/react-query zustand

# Note: Tailwind CSS 4.1 is installed automatically by create-next-app
# It uses @tailwindcss/postcss and a single `@import "tailwindcss"` in globals.css

# 3. Initialize Git (already done by create-next-app)
git add .
git commit -m "Initial commit"

# 4. Create GitHub repository
gh repo create songrank --public --source=. --remote=origin
git push -u origin main

# 5. Deploy to Vercel
# - Go to vercel.com → Import Project
# - Connect GitHub repository
# - Add environment variables
# - Deploy (Next.js is auto-detected)
```

**Continuous Deployment:**

```bash
# Daily development workflow
git checkout -b feature/battle-interface
# ... make changes ...
npm run dev  # Test locally at localhost:3000

# Commit and push
git add .
git commit -m "Add battle interface"
git push origin feature/battle-interface

# Vercel automatically deploys preview at:
# https://songrank-git-feature-battle-interface.vercel.app

# Merge to main → Auto-deploy to production
gh pr create --fill
gh pr merge
# Now live at: https://songrank.vercel.app
```

### 11.2 Environment Configuration

**Vercel Environment Variables:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public, RLS-protected)
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` - Spotify app client ID (public)
- `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` - OAuth callback URL (public)
- `SUPABASE_URL` - Supabase project URL (server-only, for Route Handlers)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (SECRET, server-only)

**Local Development (.env.local):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=abc123def456
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (for Route Handlers)
```

### 11.3 Monitoring & Analytics

**Error Tracking:**

- Use Vercel Analytics (built-in)
- Optional: Sentry for detailed error tracking

**Performance Monitoring:**

- Vercel Speed Insights (built-in)
- Track WHR calculation times via `whr_calculations` table

**Usage Metrics (Privacy-First):**

- PostHog or Plausible Analytics
- Track: Battles per session, session completion rate, WHR trigger frequency
- Never track: Personal data, song preferences, user identities

### 11.4 Backup Strategy

**Supabase Backups:**

- Daily automated backups (included in free tier)
- Manual backup before major migrations:
  ```bash
  # Export database
  supabase db dump -f backup-$(date +%Y%m%d).sql
  ```

**Version Control:**

- All code in GitHub (automatic backup)
- Database migrations in `supabase/migrations/` (versioned)

---

## 12. Cost Estimate

### 12.1 Monthly Operational Costs

**Infrastructure:**

- **Vercel Hobby:** $0 (existing subscription, includes 100GB bandwidth/month)
- **Supabase Free Tier:** $0 (500MB database, 50K monthly active users, 2GB file storage)
- **Spotify API:** $0 (free for non-commercial use)
- **Domain (optional):** $12/year (~$1/month) for custom domain like songrank.app

**Total: ~$0-1/month** for MVP

**When to Upgrade:**

- **Supabase Pro ($25/month):** When database >500MB or need >50K MAU
- **Vercel Pro ($20/month):** When bandwidth >100GB or need advanced features
- **Likely timeline:** 6+ months after launch (MVP well within free tiers)

### 12.2 Scaling Projections

**Free Tier Capacity:**

- **Database:** 500MB ≈ 100,000 songs + 500,000 battles
- **Bandwidth:** 100GB ≈ 1M page loads (assuming avg 100KB/page)
- **Function Invocations:** Unlimited (Vercel Hobby)
- **Realistic Capacity:** 100+ active users for 6+ months

---

## 13. Success Criteria for MVP

### 13.1 Functional Requirements

✅ User can import 13 Midnight Oil albums (150+ songs) in <5 minutes  
✅ User can complete album ranking (66 battles) in <1 hour  
✅ WHR ratings converge with RD <100 after album completion  
✅ Spotify playback works reliably for 95%+ of songs  
✅ Rankings update within 2 seconds of battle completion (Elo)  
✅ Manual WHR recalculation completes in <3 seconds  
✅ Multi-user: Friend can join and see controversy scores  
✅ System handles 5,000+ battles without performance degradation

### 13.2 Quality Requirements

✅ Zero data loss (battles persist across sessions, browser crashes)  
✅ 99.5%+ uptime during testing period  
✅ <500ms page load times (rankings, battle interface)  
✅ Mobile responsive (works on phones ≥375px width)  
✅ No console errors in production  
✅ Accessibility: keyboard navigation works for all core features

### 13.3 User Satisfaction

✅ Author (Daniel) successfully ranks Midnight Oil catalog (150 songs)  
✅ Author invites friend to collaborate  
✅ Both users agree final rankings "feel right" (>8/10 subjective rating)  
✅ System ready to scale to Bruce Springsteen (~350 songs)  
✅ Users report "addictive" battle experience (qualitative feedback)

---

## 14. Risks and Mitigations

### 14.1 Technical Risks

**Risk:** Spotify API rate limiting during album import  
**Likelihood:** Medium | **Impact:** Medium  
**Mitigation:** Exponential backoff, aggressive caching, batch requests

**Risk:** WHR performance degrades with >10,000 battles  
**Likelihood:** Low | **Impact:** High  
**Mitigation:** Profile early, optimize hot paths, consider incremental updates post-MVP

**Risk:** Supabase RLS policies too restrictive, blocking legitimate access  
**Likelihood:** Low | **Impact:** Medium  
**Mitigation:** Comprehensive testing with multi-user scenarios, fallback to service role queries

**Risk:** Token refresh fails, user loses Spotify connection mid-session  
**Likelihood:** Medium | **Impact:** Low  
**Mitigation:** Graceful error handling, retry logic, fallback to instant decision mode

### 14.2 Product Risks

**Risk:** Users experience battle fatigue after 50+ consecutive battles  
**Likelihood:** Medium | **Impact:** Medium  
**Mitigation:** Session breaks (every 20 battles), varied battle types, progress visualization, "pause anytime" design

**Risk:** Multi-user consensus algorithm doesn't match user expectations  
**Likelihood:** Low | **Impact:** Medium  
**Mitigation:** Transparent algorithm explanation, show individual rankings alongside consensus, allow user overrides

**Risk:** Users don't understand WHR vs Elo differences  
**Likelihood:** Medium | **Impact:** Low  
**Mitigation:** Clear UI labels ("Quick estimate" vs "Accurate calculation"), educational tooltips, hide complexity by default

**Risk:** Friend collaboration has friction (invites don't work, unclear UX)  
**Likelihood:** Medium | **Impact:** High  
**Mitigation:** Simple invite flow (copy link), clear onboarding for collaborators, test extensively with 2-user scenarios

### 14.3 Business Risks

**Risk:** Spotify changes API terms or pricing  
**Likelihood:** Low | **Impact:** Critical  
**Mitigation:** Monitor API announcements, have migration plan for alternative sources (Apple Music, local files), design system to be provider-agnostic

**Risk:** Copyright issues with displaying album artwork  
**Likelihood:** Very Low | **Impact:** Medium  
**Mitigation:** Use only Spotify-provided artwork (covered by their API terms), never store images locally

**Risk:** Low user adoption (only Daniel uses it)  
**Likelihood:** Medium | **Impact:** Low (it's a personal tool!)  
**Mitigation:** MVP designed for 1-2 users first, scaling is optional post-MVP

---

## 15. Open Questions & Decisions Needed

### 15.1 Technical Decisions

**Q:** Should we implement incremental WHR updates or always full recalculation?  
**Decision:** Start with full recalculation (simpler). If performance becomes issue with >10K battles, optimize later.

**Q:** How to handle songs that appear on multiple albums (live versions, remasters)?  
**Decision:** Default to deduplication by ISRC. Add "Show all versions" toggle post-MVP if users request it.

**Q:** Should WHR Route Handler timeout after 10 seconds (Vercel limit)?
**Decision:** Implement pagination: Process max 10,000 battles per invocation. For larger datasets, split into multiple calls.

### 15.2 Product Decisions

**Q:** Should draws be limited to 10% of battles, or unlimited?  
**Decision:** Start with 10% hard limit. Show warning at 8%: "Only 2 draws remaining in this session."

**Q:** Should we show ratings numerically (1847) or hide behind relative rankings?  
**Decision:** Show both. Default view shows numbers for transparency. Add "Simple Mode" toggle to hide numbers post-MVP.

**Q:** How to handle users without Spotify Premium (can't use Web Playback SDK)?  
**Decision:** Show upgrade prompt on first battle attempt. Allow instant-decision mode (no playback). Use 30-sec preview URLs where available (work without Premium).

### 15.3 UX Decisions

**Q:** Should battle interface auto-advance to next battle after decision?  
**Decision:** Yes, with 1-second delay and undo button in corner. Allow users to disable auto-advance in settings.

**Q:** Should we show opponent ratings during battles (spoils "blind" comparison)?  
**Decision:** No for MVP. Ratings are hidden during battles to avoid bias. Show in post-battle summary if user wants.

**Q:** How to onboard new users who've never done pairwise comparison?  
**Decision:** Interactive 5-battle tutorial with fake songs on first launch. Skippable for power users.

---

## 16. Appendix

### 16.1 File Structure

```
songrank/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home/Projects list
│   ├── globals.css              # Global styles (@import "tailwindcss")
│   ├── battle/
│   │   └── [sessionId]/
│   │       └── page.tsx         # Battle interface
│   ├── rankings/
│   │   └── [projectId]/
│   │       └── page.tsx         # Rankings dashboard
│   ├── settings/
│   │   └── page.tsx             # Settings page
│   ├── callback/
│   │   └── page.tsx             # Spotify OAuth callback
│   └── api/                     # Next.js Route Handlers
│       └── calculate-whr/
│           └── route.ts         # WHR computation
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SpotifyConnect.tsx
│   ├── battle/
│   │   ├── BattleInterface.tsx
│   │   ├── SongCard.tsx
│   │   ├── ConfidenceSelector.tsx
│   │   └── PlaybackControls.tsx
│   ├── rankings/
│   │   ├── RankingsTable.tsx
│   │   ├── RankingFilters.tsx
│   │   ├── SongDetailModal.tsx
│   │   └── FreshnessIndicator.tsx
│   ├── sessions/
│   │   ├── SessionWizard.tsx
│   │   ├── SessionList.tsx
│   │   └── SessionProgress.tsx
│   └── shared/
│       ├── Navbar.tsx
│       └── Loading.tsx
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── spotify.ts               # Spotify API calls
│   ├── elo.ts                   # Quick Elo updates
│   ├── whr-trigger.ts           # WHR trigger logic
│   └── types.ts                 # TypeScript types
├── hooks/
│   ├── useAuth.ts
│   ├── useSpotify.ts
│   ├── useBattle.ts
│   └── useRankings.ts
├── supabase/
│   └── migrations/
│       └── 20260127_initial_schema.sql
├── public/
│   └── favicon.ico
├── .env.example
├── .env.local                   # Local env vars (gitignored)
├── package.json
├── tsconfig.json
├── next.config.ts               # Next.js configuration
├── postcss.config.mjs           # PostCSS config for Tailwind 4.1
└── README.md
```

### 16.2 Key Dependencies

```json
{
  "dependencies": {
    "next": "^16.1.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-react": "^0.4.2",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.1.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/postcss": "^4.1.0",
    "postcss": "^8.4.33"
  }
}
```

### 16.3 Useful Resources

**Spotify API:**

- Documentation: https://developer.spotify.com/documentation/web-api
- Web Playback SDK: https://developer.spotify.com/documentation/web-playback-sdk
- OAuth Guide: https://developer.spotify.com/documentation/web-api/tutorials/code-flow

**Supabase:**

- Documentation: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

**WHR Academic References:**

- Whole-History Rating: Rémi Coulom (2008)
- Bradley-Terry Model: Bradley & Terry (1952)
- Elo Rating System: Arpad Elo (1961)

**Next.js:**

- Documentation: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**Vercel:**

- Documentation: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/projects/environment-variables

**Tailwind CSS 4.1:**

- Documentation: https://tailwindcss.com/docs
- Next.js Guide: https://tailwindcss.com/docs/installation/framework-guides/nextjs

---

## 17. Approval & Next Steps

**Product Owner:** Daniel  
**Created:** January 27, 2026  
**Status:** ✅ Ready for Development

**Next Steps:**

1. ✅ Review and approve this PRD
2. Set up Supabase project (30 minutes)
3. Set up Vercel project (15 minutes)
4. Run database migration
5. Begin Phase 0: Infrastructure setup
6. Weekly progress reviews

**Success Definition:**
MVP is "done" when:

- Daniel ranks all 150 Midnight Oil songs
- Friend joins and completes at least one album
- Both users rate the final rankings >8/10
- System is ready to import Bruce Springsteen

**Target Completion:** 10-12 weeks from start

---

**END OF PRD**  
**Version 2.0 - Complete & Ready for Implementation**
