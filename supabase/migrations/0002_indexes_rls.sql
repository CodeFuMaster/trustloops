-- Migration: Add indexes and Row Level Security policies
-- Date: 2025-08-01
-- Description: Performance indexes and security policies for projects and testimonials

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_project_approved ON testimonials(project_id, approved);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
-- Only authenticated users can create projects
CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only read/update/delete their own projects
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Testimonials RLS Policies
-- Anyone can create testimonials (public submission)
CREATE POLICY "Anyone can create testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

-- Only project owners can approve/manage testimonials
CREATE POLICY "Project owners can manage testimonials" ON testimonials
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = testimonials.project_id
        )
    );

-- Project owners can read all testimonials for their projects
CREATE POLICY "Project owners can read all testimonials" ON testimonials
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = testimonials.project_id
        )
    );

-- Public can read approved testimonials (for wall display)
CREATE POLICY "Public can read approved testimonials" ON testimonials
    FOR SELECT USING (approved = true);

-- Project owners can delete testimonials
CREATE POLICY "Project owners can delete testimonials" ON testimonials
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = testimonials.project_id
        )
    );
