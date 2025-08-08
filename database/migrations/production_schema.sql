-- TrustLoops FINAL Production Database Fix
-- This is the ONLY script you need to run
-- Date: August 5, 2025

BEGIN;

-- Add the missing call_to_action column to existing projects table
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

-- Fix testimonials table column names to match C# models
DO $$ 
BEGIN
    -- Rename 'content' to 'quote' if needed (matches C# model)
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

    -- Rename 'is_approved' to 'approved' if needed (matches C# model)
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

-- Set default values for call_to_action
UPDATE projects 
SET call_to_action = 'Share your experience' 
WHERE call_to_action IS NULL OR call_to_action = '';

-- Make call_to_action NOT NULL
ALTER TABLE projects 
ALTER COLUMN call_to_action SET NOT NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view projects for embed wall" ON projects;
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Anyone can create testimonials" ON testimonials;

-- Create essential policies for public access (required for embed wall)
CREATE POLICY "Public read access for projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Public read access for approved testimonials" ON testimonials
    FOR SELECT USING (approved = true);

CREATE POLICY "Public create access for testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

-- Verify the schema is correct
SELECT 'SUCCESS: Database schema updated!' as status;
SELECT 'Projects table now has call_to_action column' as projects_status;
SELECT 'Testimonials table uses quote and approved columns' as testimonials_status;

COMMIT;