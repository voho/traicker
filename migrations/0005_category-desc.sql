-- Migration number: 0005 	 2025-09-07T18:44:42.320Z

-- Add AI categorization metadata to events (nullable)
-- Short AI rationale for category
ALTER TABLE event ADD COLUMN ai_category_explain TEXT NULL;
-- Confidence 0..1
ALTER TABLE event ADD COLUMN ai_category_confidence NUMERIC NULL CHECK (ai_category_confidence >= 0 AND ai_category_confidence <= 1);
-- AI model identifier used for categorization
ALTER TABLE event ADD COLUMN ai_category_model TEXT NULL;
