-- TrustLoops Database Schema for Supabase Cloud
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table (for project owners)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Projects table (testimonial collection projects)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_title VARCHAR(255),
    customer_company VARCHAR(255),
    quote TEXT,
    video_url VARCHAR(500),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    approved BOOLEAN DEFAULT FALSE,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Testimonials
CREATE POLICY "Anyone can view approved testimonials" ON testimonials
    FOR SELECT USING (approved = true);

CREATE POLICY "Project owners can view all testimonials for their projects" ON testimonials
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Project owners can update testimonials for their projects" ON testimonials
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete testimonials for their projects" ON testimonials
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video uploads
CREATE POLICY "Anyone can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Anyone can view videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'testimonials');

CREATE POLICY "Project owners can delete videos for their testimonials" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'testimonials' AND
        name LIKE '%' || auth.uid()::text || '%'
    );

-- Insert sample data for testing
INSERT INTO users (id, email) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@trustloops.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, name, slug, description, user_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Sample Product', 'sample-product', 'A sample project for testing TrustLoops functionality', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (slug) DO NOTHING;

-- Success message
SELECT 'TrustLoops database schema created successfully! 🎉' as message;
