-- Migration: Add call_to_action column to projects table
-- Date: 2025-08-05
-- Description: Add call_to_action column to support custom call-to-action messages for testimonial collection

BEGIN;

-- Add call_to_action column to projects table
ALTER TABLE projects 
ADD COLUMN call_to_action TEXT DEFAULT 'Share your experience';

-- Update existing projects to have a default call to action
UPDATE projects 
SET call_to_action = 'Share your experience' 
WHERE call_to_action IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE projects 
ALTER COLUMN call_to_action SET NOT NULL;

COMMIT;
