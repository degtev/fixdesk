CREATE TABLE IF NOT EXISTS bug_attachments (
    id SERIAL PRIMARY KEY,
    bug_id INTEGER NOT NULL REFERENCES bug_lists(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'link')),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_attachments_bug_id ON bug_attachments(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_attachments_type ON bug_attachments(type);
CREATE INDEX IF NOT EXISTS idx_bug_attachments_created_by ON bug_attachments(created_by);

CREATE OR REPLACE FUNCTION update_bug_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_bug_attachments_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_bug_attachments_updated_at
            BEFORE UPDATE ON bug_attachments
            FOR EACH ROW
            EXECUTE FUNCTION update_bug_attachments_updated_at();
    END IF;
END $$; 