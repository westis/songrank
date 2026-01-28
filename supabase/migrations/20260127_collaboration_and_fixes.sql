-- ============================================================
-- 1. Add confidence_levels column to projects (if not already run)
-- ============================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS confidence_levels integer NOT NULL DEFAULT 1;

-- Add check constraint separately (IF NOT EXISTS not supported for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_confidence_levels_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_confidence_levels_check
      CHECK (confidence_levels BETWEEN 1 AND 4);
  END IF;
END $$;

-- ============================================================
-- 2. Add invite_code to projects for sharing
-- ============================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS invite_code UUID DEFAULT uuid_generate_v4();

-- Index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_projects_invite_code ON projects(invite_code);

-- ============================================================
-- 3. User profiles table (display names for collaboration)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (needed to show collaborator names)
CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- 4. Missing RLS policies
-- ============================================================

-- Songs: allow owners to update songs in their projects
CREATE POLICY "Users can update songs in own projects" ON songs
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

-- Battles: allow users to update their own battles (for editing results)
CREATE POLICY "Users can update own battles" ON battles
  FOR UPDATE USING (user_id = auth.uid());

-- Project collaborators: allow users to insert themselves (for invite acceptance)
CREATE POLICY "Users can join via invite" ON project_collaborators
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. Trigger for user_profiles updated_at
-- ============================================================
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
