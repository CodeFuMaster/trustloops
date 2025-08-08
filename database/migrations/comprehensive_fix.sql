-- TrustLoops COMPREHENSIVE Production Fix
-- This matches your actual C# models exactly
-- Run this in Supabase SQL Editor

BEGIN;

-- Add missing call_to_action column to projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'call_to_action'
    ) THEN
        ALTER TABLE projects ADD COLUMN call_to_action TEXT DEFAULT 'Share your experience';
        RAISE NOTICE 'Added call_to_action column to projects';
    ELSE
        RAISE NOTICE 'call_to_action column already exists';
    END IF;
END $$;

-- Ensure testimonials table has correct column names (quote not content, approved not is_approved)
DO $$ 
BEGIN
    -- Check if 'quote' column exists, if not and 'content' exists, rename it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'testimonials' AND column_name = 'quote'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'testimonials' AND column_name = 'content'
    ) THEN
        ALTER TABLE testimonials RENAME COLUMN content TO quote;
        RAISE NOTICE 'Renamed content column to quote in testimonials';
    END IF;

    -- Check if 'approved' column exists, if not and 'is_approved' exists, rename it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'testimonials' AND column_name = 'approved'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'testimonials' AND column_name = 'is_approved'
    ) THEN
        ALTER TABLE testimonials RENAME COLUMN is_approved TO approved;
        RAISE NOTICE 'Renamed is_approved column to approved in testimonials';
    END IF;
END $$;

-- Update any existing projects that might have NULL call_to_action values
UPDATE projects 
SET call_to_action = 'Share your experience' 
WHERE call_to_action IS NULL OR call_to_action = '';

-- Make sure the column is NOT NULL
ALTER TABLE projects 
ALTER COLUMN call_to_action SET NOT NULL;

-- Verify the fix by showing table structures
SELECT 'PROJECTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

SELECT 'TESTIMONIALS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'testimonials' 
ORDER BY ordinal_position;

SELECT 'SUCCESS: Database schema now matches your C# models!' as status;

COMMIT;
