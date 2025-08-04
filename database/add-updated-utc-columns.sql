-- Migration to add missing updated_utc columns
-- Run this in your Supabase SQL Editor

-- Add updated_utc column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_utc column to projects table  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_utc column to testimonials table
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_utc = created_utc
UPDATE users SET updated_utc = created_utc WHERE updated_utc IS NULL;
UPDATE projects SET updated_utc = created_utc WHERE updated_utc IS NULL;
UPDATE testimonials SET updated_utc = created_utc WHERE updated_utc IS NULL;

-- Success message
SELECT 'Migration completed! Added updated_utc columns to all tables. 🎉' as message;
