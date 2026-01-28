-- ============================================================
-- Spotify OAuth tokens storage
-- ============================================================
CREATE TABLE IF NOT EXISTS spotify_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spotify tokens" ON spotify_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own spotify tokens" ON spotify_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own spotify tokens" ON spotify_tokens
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own spotify tokens" ON spotify_tokens
    FOR DELETE USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user ON spotify_tokens(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_spotify_tokens_updated_at
    BEFORE UPDATE ON spotify_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
