-- Initial schema for TrustLoops
-- Created: 2025-07-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    user_id UUID NOT NULL,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_title VARCHAR(255),
    customer_company VARCHAR(255),
    quote TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    approved BOOLEAN DEFAULT FALSE,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX idx_testimonials_approved ON testimonials(approved);
CREATE INDEX idx_testimonials_created ON testimonials(created_utc DESC);

-- Function to update updated_utc timestamp
CREATE OR REPLACE FUNCTION update_updated_utc_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_utc = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_utc
CREATE TRIGGER update_projects_updated_utc 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_utc_column();

CREATE TRIGGER update_testimonials_updated_utc 
    BEFORE UPDATE ON testimonials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_utc_column();

-- Sample data for development
INSERT INTO projects (id, name, slug, user_id, description) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Sample Product',
    'sample-product',
    '550e8400-e29b-41d4-a716-446655440001',
    'A sample project for testing testimonials'
);

INSERT INTO testimonials (project_id, customer_name, customer_email, quote, approved) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'John Doe',
    'john@example.com',
    'This product completely transformed our workflow. Highly recommended!',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Jane Smith',
    'jane@example.com',
    'Outstanding support and amazing features. Five stars!',
    true
);
