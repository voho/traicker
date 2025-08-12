-- Migration number: 0002 	 2025-08-12T18:34:40.742Z
CREATE TABLE events
(
    event_id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'working', 'done')),
    prompt TEXT NOT NULL,
    effective_at DATETIME NOT NULL,
    ai_desc TEXT,
    ai_explain TEXT,
    ai_confidence NUMERIC,
    ai_type TEXT CHECK (ai_type IN ('income', 'expense')),
    ai_date DATETIME,
    ai_amount NUMERIC,
    ai_currency TEXT CHECK (length(ai_currency) = 3)
);

CREATE INDEX idx_events_user_id ON events (user_id);
CREATE INDEX idx_events_status ON events (status);
