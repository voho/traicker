-- Migration number: 0004 	 2025-09-07T18:39:49.197Z

-- Add nullable single-category reference on event
ALTER TABLE event ADD COLUMN category_id TEXT NULL REFERENCES category(category_id);

-- Drop many-to-many link table (no data migration performed here)
DROP TABLE IF EXISTS event_category;
