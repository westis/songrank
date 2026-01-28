-- Fix infinite recursion in RLS policies
-- The projects SELECT policy queries project_collaborators,
-- whose SELECT policy queries projects back = infinite loop.
-- Fix: SECURITY DEFINER function bypasses RLS for the inner check.

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_accessible_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM projects WHERE owner_id = auth.uid()
  UNION
  SELECT project_id FROM project_collaborators WHERE user_id = auth.uid();
$$;

-- 2. Drop all affected policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view songs in accessible projects" ON songs;
DROP POLICY IF EXISTS "Users can create songs in own projects" ON songs;
DROP POLICY IF EXISTS "Users can delete songs in own projects" ON songs;
DROP POLICY IF EXISTS "Users can view battles in accessible projects" ON battles;
DROP POLICY IF EXISTS "Users can create battles in accessible projects" ON battles;
DROP POLICY IF EXISTS "Users can view ratings in accessible projects" ON ratings;
DROP POLICY IF EXISTS "Users can view sessions in accessible projects" ON battle_sessions;
DROP POLICY IF EXISTS "Users can view collaborators of accessible projects" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

-- 3. Recreate policies using the helper function

-- Projects: SELECT
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (
        id IN (SELECT public.get_accessible_project_ids())
    );

-- Songs: SELECT, INSERT, DELETE
CREATE POLICY "Users can view songs in accessible projects" ON songs
    FOR SELECT USING (
        project_id IN (SELECT public.get_accessible_project_ids())
    );

CREATE POLICY "Users can create songs in own projects" ON songs
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can delete songs in own projects" ON songs
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

-- Battles: SELECT, INSERT
CREATE POLICY "Users can view battles in accessible projects" ON battles
    FOR SELECT USING (
        project_id IN (SELECT public.get_accessible_project_ids())
    );

CREATE POLICY "Users can create battles in accessible projects" ON battles
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND project_id IN (SELECT public.get_accessible_project_ids())
    );

-- Ratings: SELECT
CREATE POLICY "Users can view ratings in accessible projects" ON ratings
    FOR SELECT USING (
        project_id IN (SELECT public.get_accessible_project_ids())
    );

-- Battle Sessions: SELECT
CREATE POLICY "Users can view sessions in accessible projects" ON battle_sessions
    FOR SELECT USING (
        project_id IN (SELECT public.get_accessible_project_ids())
    );

-- Project Collaborators: SELECT, INSERT, DELETE
CREATE POLICY "Users can view collaborators of accessible projects" ON project_collaborators
    FOR SELECT USING (
        project_id IN (SELECT public.get_accessible_project_ids())
    );

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "Project owners can remove collaborators" ON project_collaborators
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );
