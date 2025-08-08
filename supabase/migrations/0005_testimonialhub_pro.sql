-- Migration: TestimonialHub Pro Features
-- Add billing and plan management to support LemonSqueezy integration
-- Run this in your Supabase SQL Editor

-- Add billing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Add indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Add usage tracking for testimonials per project (for limits)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS testimonial_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_testimonial_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create plan_limits table for feature restrictions
CREATE TABLE IF NOT EXISTS plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type TEXT NOT NULL,
    max_projects INTEGER,
    max_testimonials_per_project INTEGER,
    max_monthly_testimonials INTEGER,
    can_export_csv BOOLEAN DEFAULT false,
    can_bulk_approve BOOLEAN DEFAULT false,
    can_custom_branding BOOLEAN DEFAULT false,
    can_custom_domain BOOLEAN DEFAULT false,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan_type, max_projects, max_testimonials_per_project, max_monthly_testimonials, can_export_csv, can_bulk_approve, can_custom_branding, can_custom_domain)
VALUES 
    ('free', 1, 5, 10, false, false, false, false),
    ('testimonialhub_pro', 10, 1000, 500, true, true, true, false),
    ('statusloops_pro', 5, 0, 0, false, false, true, true),
    ('shotloops_pro', 0, 0, 0, false, false, false, false),
    ('trustloops_bundle', 25, 2000, 1000, true, true, true, true)
ON CONFLICT (plan_type) DO UPDATE SET
    max_projects = EXCLUDED.max_projects,
    max_testimonials_per_project = EXCLUDED.max_testimonials_per_project,
    max_monthly_testimonials = EXCLUDED.max_monthly_testimonials,
    can_export_csv = EXCLUDED.can_export_csv,
    can_bulk_approve = EXCLUDED.can_bulk_approve,
    can_custom_branding = EXCLUDED.can_custom_branding,
    can_custom_domain = EXCLUDED.can_custom_domain,
    updated_utc = NOW();

-- Create function to update testimonial counts
CREATE OR REPLACE FUNCTION update_project_testimonial_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment counts
        UPDATE projects 
        SET 
            testimonial_count = testimonial_count + 1,
            monthly_testimonial_count = monthly_testimonial_count + 1,
            updated_utc = NOW()
        WHERE id = NEW.project_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement counts
        UPDATE projects 
        SET 
            testimonial_count = GREATEST(testimonial_count - 1, 0),
            monthly_testimonial_count = GREATEST(monthly_testimonial_count - 1, 0),
            updated_utc = NOW()
        WHERE id = OLD.project_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for testimonial count updates
DROP TRIGGER IF EXISTS testimonial_count_trigger ON testimonials;
CREATE TRIGGER testimonial_count_trigger
    AFTER INSERT OR DELETE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_project_testimonial_count();

-- Create function to reset monthly counts (called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_testimonial_counts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE projects 
    SET 
        monthly_testimonial_count = 0,
        last_monthly_reset = NOW(),
        updated_utc = NOW()
    WHERE last_monthly_reset < (NOW() - INTERVAL '1 month');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing projects with current testimonial counts
UPDATE projects 
SET testimonial_count = (
    SELECT COUNT(*) 
    FROM testimonials 
    WHERE testimonials.project_id = projects.id
),
monthly_testimonial_count = (
    SELECT COUNT(*) 
    FROM testimonials 
    WHERE testimonials.project_id = projects.id 
    AND created_utc >= (NOW() - INTERVAL '30 days')
),
updated_utc = NOW();

-- Enable RLS on plan_limits table
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read plan limits (for feature checking)
CREATE POLICY "Plan limits are publicly readable" ON plan_limits
    FOR SELECT USING (true);

-- Policy: Only service role can modify plan limits
CREATE POLICY "Only service role can modify plan limits" ON plan_limits
    FOR ALL USING (auth.role() = 'service_role');

-- Success message
SELECT 'TestimonialHub Pro features migration completed! 🎉' as message,
       'Added billing fields, plan limits, and usage tracking.' as details;
