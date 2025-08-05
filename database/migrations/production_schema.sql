-- TrustLoops Production Database Schema
-- Complete migration script for production deployment
-- Date: August 5, 2025

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table with all required columns
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    call_to_action TEXT NOT NULL DEFAULT 'Share your experience',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT projects_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT projects_name_length CHECK (length(name) >= 1 AND length(name) <= 255),
    CONSTRAINT projects_slug_length CHECK (length(slug) >= 1 AND length(slug) <= 255)
);

-- Create testimonials table with all required columns
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_title VARCHAR(255),
    customer_company VARCHAR(255),
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    video_url TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT testimonials_name_length CHECK (length(customer_name) >= 1 AND length(customer_name) <= 255),
    CONSTRAINT testimonials_email_format CHECK (customer_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT testimonials_content_length CHECK (length(content) >= 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON testimonials 
    FOR EACH ROW EXECUTE FUNCTION update_testimonials_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Public read access for projects (for embed wall)
CREATE POLICY "Anyone can view projects for embed wall" ON projects
    FOR SELECT USING (true);

-- Testimonials policies
CREATE POLICY "Project owners can view all testimonials for their projects" ON testimonials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = testimonials.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Project owners can update testimonials for their projects" ON testimonials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = testimonials.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete testimonials for their projects" ON testimonials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = testimonials.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Public read access for approved testimonials (for embed wall)
CREATE POLICY "Anyone can view approved testimonials" ON testimonials
    FOR SELECT USING (is_approved = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create storage bucket for video testimonials if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for testimonial videos
CREATE POLICY "Public read access for testimonial videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'testimonial-videos');

CREATE POLICY "Authenticated users can upload testimonial videos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'testimonial-videos');

CREATE POLICY "Users can update their own video uploads" ON storage.objects
    FOR UPDATE USING (bucket_id = 'testimonial-videos');

COMMIT;

-- Verification queries (run these after migration)
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM testimonials;
-- SELECT tablename, schemaname FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
