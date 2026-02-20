ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_workspace_uuid') THEN
        ALTER TABLE workspaces ADD CONSTRAINT unique_workspace_uuid UNIQUE (uuid);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workspaces_uuid ON workspaces(uuid);