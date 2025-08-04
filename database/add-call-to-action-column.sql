-- Add call_to_action column to projects table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS call_to_action VARCHAR(255) DEFAULT 'Share your experience';

-- Update existing projects to have the default call to action
UPDATE projects SET call_to_action = 'Share your experience' WHERE call_to_action IS NULL;
