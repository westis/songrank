-- Add allow_draws column to projects table
-- Default to true to maintain backward compatibility

ALTER TABLE projects
ADD COLUMN allow_draws boolean NOT NULL DEFAULT true;

-- Add a comment for documentation
COMMENT ON COLUMN projects.allow_draws IS 'Whether draws are allowed in battles for this project';
