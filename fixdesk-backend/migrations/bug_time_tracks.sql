CREATE TABLE IF NOT EXISTS bug_time_tracks (
    id SERIAL PRIMARY KEY,
    bug_id INTEGER NOT NULL REFERENCES bug_lists(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (bug_id, user_id, end_time)
);

CREATE INDEX IF NOT EXISTS idx_bug_time_tracks_bug_id ON bug_time_tracks(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_time_tracks_user_id ON bug_time_tracks(user_id); 