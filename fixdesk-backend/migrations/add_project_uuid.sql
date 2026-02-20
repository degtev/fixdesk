ALTER TABLE projects ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_uuid') THEN
        ALTER TABLE projects ADD CONSTRAINT unique_project_uuid UNIQUE (uuid);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_uuid ON projects(uuid);