-- Add UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add UUID column to bug_lists
ALTER TABLE bug_lists 
ADD COLUMN IF NOT EXISTS uuid UUID UNIQUE DEFAULT uuid_generate_v4();

-- Create index on UUID
CREATE INDEX IF NOT EXISTS idx_bug_lists_uuid ON bug_lists(uuid);

-- Update existing rows to have UUIDs (if any don't have them)
UPDATE bug_lists SET uuid = uuid_generate_v4() WHERE uuid IS NULL;

-- Make UUID NOT NULL after all rows have values
ALTER TABLE bug_lists ALTER COLUMN uuid SET NOT NULL;

-- Note: bug_attachments and bug_time_tracks will continue using bug_id (INTEGER)
-- but we'll add lookup functions in the application layer

