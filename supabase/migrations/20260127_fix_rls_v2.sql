-- Fix RLS v2: Fully idempotent. Safe to run multiple times.
-- Drops ALL policies (old names + new names), then recreates cleanly.

-- ============================================================
-- 1. DROP EVERYTHING (old names from initial migration)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can view songs in accessible projects" ON songs;
DROP POLICY IF EXISTS "Users can create songs in own projects" ON songs;
DROP POLICY IF EXISTS "Users can delete songs in own projects" ON songs;
DROP POLICY IF EXISTS "Users can view battles in accessible projects" ON battles;
DROP POLICY IF EXISTS "Users can create battles in accessible projects" ON battles;
DROP POLICY IF EXISTS "Users can delete own battles" ON battles;
DROP POLICY IF EXISTS "Users can view ratings in accessible projects" ON ratings;
DROP POLICY IF EXISTS "Users can upsert own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view sessions in accessible projects" ON battle_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON battle_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON battle_sessions;
DROP POLICY IF EXISTS "Users can view collaborators of accessible projects" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view own WHR calculations" ON whr_calculations;
DROP POLICY IF EXISTS "Users can create own WHR calculations" ON whr_calculations;

-- ============================================================
-- 2. DROP EVERYTHING (new names from partial v2 runs)
-- ============================================================
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "songs_select" ON songs;
DROP POLICY IF EXISTS "songs_insert" ON songs;
DROP POLICY IF EXISTS "songs_delete" ON songs;
DROP POLICY IF EXISTS "battles_select" ON battles;
DROP POLICY IF EXISTS "battles_insert" ON battles;
DROP POLICY IF EXISTS "battles_delete" ON battles;
DROP POLICY IF EXISTS "ratings_select" ON ratings;
DROP POLICY IF EXISTS "ratings_insert" ON ratings;
DROP POLICY IF EXISTS "ratings_update" ON ratings;
DROP POLICY IF EXISTS "sessions_select" ON battle_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON battle_sessions;
DROP POLICY IF EXISTS "sessions_update" ON battle_sessions;
DROP POLICY IF EXISTS "collaborators_select" ON project_collaborators;
DROP POLICY IF EXISTS "collaborators_insert" ON project_collaborators;
DROP POLICY IF EXISTS "collaborators_delete" ON project_collaborators;
DROP POLICY IF EXISTS "whr_select" ON whr_calculations;
DROP POLICY IF EXISTS "whr_insert" ON whr_calculations;

-- ============================================================
-- 3. DROP the broken SECURITY DEFINER function from v1 fix
-- ============================================================
DROP FUNCTION IF EXISTS public.get_accessible_project_ids();

-- ============================================================
-- 4. RECREATE ALL POLICIES
--
-- Strategy to avoid circular recursion:
--   - projects SELECT: checks owner_id OR subqueries project_collaborators
--   - project_collaborators SELECT: checks user_id ONLY (no subquery)
--     This breaks the circular chain: projects -> collaborators -> STOP
--   - All other tables: use EXISTS on projects (owner check) OR
--     EXISTS on project_collaborators (membership check) separately
-- ============================================================

-- ---- Projects ----
CREATE POLICY "projects_select" ON projects
    FOR SELECT USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT project_id FROM project_collaborators
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "projects_insert" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "projects_delete" ON projects
    FOR DELETE USING (owner_id = auth.uid());

-- ---- Project Collaborators ----
-- CRITICAL: No subqueries here. Simple user_id check only.
-- This breaks the recursion chain (projects -> collaborators -> STOP).
CREATE POLICY "collaborators_select" ON project_collaborators
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "collaborators_insert" ON project_collaborators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "collaborators_delete" ON project_collaborators
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id AND owner_id = auth.uid()
        )
    );

-- ---- Songs ----
CREATE POLICY "songs_select" ON songs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = songs.project_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = songs.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "songs_insert" ON songs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "songs_delete" ON songs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = songs.project_id AND owner_id = auth.uid()
        )
    );

-- ---- Battles ----
CREATE POLICY "battles_select" ON battles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = battles.project_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = battles.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "battles_insert" ON battles
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM projects
                WHERE id = project_id AND owner_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM project_collaborators
                WHERE project_id = battles.project_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "battles_delete" ON battles
    FOR DELETE USING (user_id = auth.uid());

-- ---- Ratings ----
CREATE POLICY "ratings_select" ON ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = ratings.project_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = ratings.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "ratings_insert" ON ratings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ratings_update" ON ratings
    FOR UPDATE USING (user_id = auth.uid());

-- ---- Battle Sessions ----
CREATE POLICY "sessions_select" ON battle_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = battle_sessions.project_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = battle_sessions.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "sessions_insert" ON battle_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update" ON battle_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- ---- WHR Calculations ----
CREATE POLICY "whr_select" ON whr_calculations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "whr_insert" ON whr_calculations
    FOR INSERT WITH CHECK (user_id = auth.uid());
