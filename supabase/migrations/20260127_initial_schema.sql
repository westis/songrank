-- SongRank Initial Schema
-- Run this in the Supabase SQL Editor to set up all tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- ============================================================
-- Indexes for performance
-- ============================================================

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

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE whr_calculations ENABLE ROW LEVEL SECURITY;

-- ---- Projects ----

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

-- ---- Songs ----

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

CREATE POLICY "Users can delete songs in own projects" ON songs
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- ---- Battles ----

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

CREATE POLICY "Users can delete own battles" ON battles
    FOR DELETE USING (user_id = auth.uid());

-- ---- Ratings ----

CREATE POLICY "Users can view ratings in accessible projects" ON ratings
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upsert own ratings" ON ratings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON ratings
    FOR UPDATE USING (user_id = auth.uid());

-- ---- Battle Sessions ----

CREATE POLICY "Users can view sessions in accessible projects" ON battle_sessions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own sessions" ON battle_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON battle_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- ---- Project Collaborators ----

CREATE POLICY "Users can view collaborators of accessible projects" ON project_collaborators
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_collaborators pc
            WHERE pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "Project owners can remove collaborators" ON project_collaborators
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- ---- WHR Calculations ----

CREATE POLICY "Users can view own WHR calculations" ON whr_calculations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own WHR calculations" ON whr_calculations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
