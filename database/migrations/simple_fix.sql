-- TrustLoops SIMPLE Production Fix - Just add the missing column
-- Run this in Supabase SQL Editor

BEGIN;

-- Add the missing call_to_action column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'call_to_action'
    ) THEN
        ALTER TABLE projects ADD COLUMN call_to_action TEXT DEFAULT 'Share your experience';
    END IF;
END $$;

-- Update any existing projects that might have NULL values
UPDATE projects 
SET call_to_action = 'Share your experience' 
WHERE call_to_action IS NULL OR call_to_action = '';

-- Make sure the column is NOT NULL
ALTER TABLE projects 
ALTER COLUMN call_to_action SET NOT NULL;

-- Verify the fix
SELECT 'Column added successfully!' as status, 
       COUNT(*) as project_count 
FROM projects;

COMMIT;
