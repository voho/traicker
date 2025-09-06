-- Migration number: 0003 	 2025-09-06T19:54:28.170Z

DROP TABLE IF EXISTS events;                  -- legacy table (replaced by event/event_raw)
DROP TABLE IF EXISTS event;                   -- drop if exists to allow clean re-create
DROP TABLE IF EXISTS event_raw;               -- drop if exists to allow clean re-create
DROP TABLE IF EXISTS category;                -- drop if exists to allow clean re-create
DROP TABLE IF EXISTS event_category;          -- drop if exists to allow clean re-create
DROP TABLE IF EXISTS user;                    -- drop if exists to allow clean re-create

-- Minimal user registry populated from Clerk IDs
CREATE TABLE user
(
    user_id TEXT PRIMARY KEY NOT NULL                                          -- Stable user identifier from Clerk
);

-- Raw user-submitted inputs used as the source of truth for processing.
-- Stores original prompt and processing status for retries/audit.
CREATE TABLE event_raw
(
    raw_event_id TEXT PRIMARY KEY NOT NULL,                                -- Correlates a single submission
    user_id TEXT NOT NULL REFERENCES user(user_id),                        -- Tenant/owner of the submission
    created_at DATETIME NOT NULL,                                          -- Submission time (UTC)
    prompt TEXT NOT NULL,                                                  -- Original raw text entered by user
    status TEXT NOT NULL CHECK (status IN ('new', 'failed', 'done')),      -- Processing state
    error TEXT NULL                                                        -- Optional error details for failures
);

CREATE INDEX idx_event_raw_user_id ON event_raw (user_id);
CREATE INDEX idx_event_raw_status ON event_raw (status);

-- Processed financial entries extracted from raw inputs.
-- Each row represents a single income/expense after AI extraction.
CREATE TABLE event
(
    event_id TEXT PRIMARY KEY NOT NULL,                                    -- Unique identifier of the processed event
    raw_event_id TEXT NULL REFERENCES event_raw(raw_event_id),             -- Optional link to corresponding raw input
    user_id TEXT NOT NULL REFERENCES user(user_id),                        -- Tenant/owner of the event
    created_at DATETIME NOT NULL,                                          -- Creation timestamp (UTC)
    updated_at DATETIME NOT NULL,                                          -- Last update timestamp (UTC)
    deleted_at DATETIME NULL,                                              -- Soft-delete timestamp
    effective_at DATETIME NOT NULL,                                        -- When the transaction happened
    description TEXT NOT NULL,                                             -- Human-readable description
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),              -- Entry type
    amount NUMERIC NOT NULL CHECK (amount > 0),                            -- Positive amount
    currency TEXT NOT NULL CHECK (length(currency) = 3 AND currency = upper(currency)), -- ISO 4217 code
    ai_explain TEXT NOT NULL,                                              -- Short AI rationale
    ai_confidence NUMERIC NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),   -- Confidence 0..1
    ai_model TEXT NOT NULL                                                 -- AI model identifier used for extraction
);

CREATE INDEX idx_event_user_id ON event (user_id);

-- User-defined category taxonomy with optional hierarchy.
CREATE TABLE category
(
    category_id TEXT PRIMARY KEY NOT NULL,                                 -- Category identifier
    parent_category_id TEXT NULL REFERENCES category(category_id),         -- Optional parent (self-FK)
    user_id TEXT NOT NULL REFERENCES user(user_id),                        -- Owner of the category
    created_at DATETIME NOT NULL,                                          -- Creation timestamp (UTC)
    updated_at DATETIME NOT NULL,                                          -- Last update timestamp (UTC)
    deleted_at DATETIME NULL,                                              -- Soft-delete timestamp
    title TEXT NOT NULL,                                                   -- Display name
    color TEXT NULL,                                                       -- Optional color
    emoji TEXT NULL,                                                       -- Optional emoji
    description TEXT NULL                                                  -- Optional description
);

CREATE INDEX idx_category_user_id ON category (user_id);

-- Allow multiple categories per event via junction table
CREATE TABLE event_category
(
    event_id TEXT NOT NULL REFERENCES event(event_id),                     -- Referenced processed event
    category_id TEXT NOT NULL REFERENCES category(category_id),            -- Referenced category
    created_at DATETIME NOT NULL,                                          -- Creation timestamp (UTC)
    updated_at DATETIME NOT NULL,                                          -- Last update timestamp (UTC)
    deleted_at DATETIME NULL,                                              -- Soft-delete timestamp
    PRIMARY KEY (event_id, category_id)
);

CREATE INDEX idx_event_category_category_id ON event_category (category_id);
CREATE INDEX idx_event_category_event_id ON event_category (event_id);
