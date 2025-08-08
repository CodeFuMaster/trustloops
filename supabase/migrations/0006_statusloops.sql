-- Migration: StatusLoops Core Tables
-- Create tables for status pages, components, incidents, and subscriptions
-- Run this in your Supabase SQL Editor

-- Status pages table
CREATE TABLE IF NOT EXISTS status_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    is_public BOOLEAN DEFAULT true,
    custom_domain TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Status page components table
CREATE TABLE IF NOT EXISTS status_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_page_id UUID REFERENCES status_pages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'operational', -- operational, degraded, down, maintenance
    status_message TEXT,
    position INTEGER DEFAULT 0,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_page_id UUID REFERENCES status_pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'investigating', -- investigating, identified, monitoring, resolved
    impact TEXT NOT NULL DEFAULT 'minor', -- minor, major, critical
    is_resolved BOOLEAN DEFAULT false,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_utc TIMESTAMP WITH TIME ZONE,
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident updates table
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident affected components (many-to-many)
CREATE TABLE IF NOT EXISTS incident_components (
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    component_id UUID REFERENCES status_components(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, component_id)
);

-- Email subscribers table
CREATE TABLE IF NOT EXISTS status_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_page_id UUID REFERENCES status_pages(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid(),
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(status_page_id, email)
);

-- Email notifications queue table
CREATE TABLE IF NOT EXISTS incident_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_page_id UUID REFERENCES status_pages(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- incident_created, incident_updated, incident_resolved
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_pages_user_id ON status_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_status_pages_slug ON status_pages(slug);
CREATE INDEX IF NOT EXISTS idx_status_pages_custom_domain ON status_pages(custom_domain);

CREATE INDEX IF NOT EXISTS idx_status_components_page_id ON status_components(status_page_id);
CREATE INDEX IF NOT EXISTS idx_status_components_status ON status_components(status);

CREATE INDEX IF NOT EXISTS idx_incidents_page_id ON incidents(status_page_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_utc DESC);

CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_created ON incident_updates(created_utc DESC);

CREATE INDEX IF NOT EXISTS idx_status_subscribers_page_id ON status_subscribers(status_page_id);
CREATE INDEX IF NOT EXISTS idx_status_subscribers_email ON status_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_status_subscribers_unsubscribe ON status_subscribers(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_notifications_sent ON incident_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON incident_notifications(created_utc) WHERE sent_at IS NULL;

-- Enable RLS on all tables
ALTER TABLE status_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for status_pages
CREATE POLICY "Users can manage their own status pages" ON status_pages
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public status pages are readable by everyone" ON status_pages
    FOR SELECT USING (is_public = true);

-- RLS Policies for status_components
CREATE POLICY "Users can manage components of their status pages" ON status_components
    FOR ALL USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Components of public status pages are readable" ON status_components
    FOR SELECT USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE is_public = true
        )
    );

-- RLS Policies for incidents
CREATE POLICY "Users can manage incidents of their status pages" ON incidents
    FOR ALL USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Incidents of public status pages are readable" ON incidents
    FOR SELECT USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE is_public = true
        )
    );

-- RLS Policies for incident_updates
CREATE POLICY "Users can manage updates of their incidents" ON incident_updates
    FOR ALL USING (
        incident_id IN (
            SELECT i.id FROM incidents i
            JOIN status_pages sp ON i.status_page_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Updates of public incidents are readable" ON incident_updates
    FOR SELECT USING (
        incident_id IN (
            SELECT i.id FROM incidents i
            JOIN status_pages sp ON i.status_page_id = sp.id
            WHERE sp.is_public = true
        )
    );

-- RLS Policies for incident_components
CREATE POLICY "Users can manage incident components" ON incident_components
    FOR ALL USING (
        incident_id IN (
            SELECT i.id FROM incidents i
            JOIN status_pages sp ON i.status_page_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Incident components are readable for public pages" ON incident_components
    FOR SELECT USING (
        incident_id IN (
            SELECT i.id FROM incidents i
            JOIN status_pages sp ON i.status_page_id = sp.id
            WHERE sp.is_public = true
        )
    );

-- RLS Policies for status_subscribers
CREATE POLICY "Users can manage subscribers of their pages" ON status_subscribers
    FOR ALL USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE user_id = auth.uid()
        )
    );

-- Allow public subscription (insert only)
CREATE POLICY "Anyone can subscribe to public status pages" ON status_subscribers
    FOR INSERT WITH CHECK (
        status_page_id IN (
            SELECT id FROM status_pages WHERE is_public = true
        )
    );

-- RLS Policies for incident_notifications
CREATE POLICY "Users can manage notifications for their pages" ON incident_notifications
    FOR ALL USING (
        status_page_id IN (
            SELECT id FROM status_pages WHERE user_id = auth.uid()
        )
    );

-- Create functions for automated incident notifications
CREATE OR REPLACE FUNCTION create_incident_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notifications for all active subscribers when incident is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO incident_notifications (
            status_page_id,
            incident_id,
            email,
            notification_type,
            subject,
            message
        )
        SELECT 
            NEW.status_page_id,
            NEW.id,
            ss.email,
            'incident_created',
            '🚨 New Incident: ' || NEW.title,
            NEW.description
        FROM status_subscribers ss
        WHERE ss.status_page_id = NEW.status_page_id 
        AND ss.is_active = true;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incident notifications
DROP TRIGGER IF EXISTS incident_notification_trigger ON incidents;
CREATE TRIGGER incident_notification_trigger
    AFTER INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION create_incident_notifications();

-- Create function to calculate overall status
CREATE OR REPLACE FUNCTION get_overall_status(page_id UUID)
RETURNS TEXT AS $$
DECLARE
    component_statuses TEXT[];
BEGIN
    SELECT array_agg(status) INTO component_statuses
    FROM status_components 
    WHERE status_page_id = page_id;
    
    -- If any component is down, overall status is down
    IF 'down' = ANY(component_statuses) THEN
        RETURN 'down';
    END IF;
    
    -- If any component is degraded, overall status is degraded
    IF 'degraded' = ANY(component_statuses) THEN
        RETURN 'degraded';
    END IF;
    
    -- If any component is in maintenance, overall status is maintenance
    IF 'maintenance' = ANY(component_statuses) THEN
        RETURN 'maintenance';
    END IF;
    
    -- Otherwise, all operational
    RETURN 'operational';
END;
$$ LANGUAGE plpgsql;

-- Insert sample status page for testing (optional)
-- Uncomment if you want test data
/*
INSERT INTO status_pages (name, description, slug, is_public)
VALUES ('Sample Status Page', 'A sample status page for testing', 'sample-status', true);

INSERT INTO status_components (status_page_id, name, status)
SELECT id, 'API', 'operational' FROM status_pages WHERE slug = 'sample-status'
UNION
SELECT id, 'Database', 'operational' FROM status_pages WHERE slug = 'sample-status'
UNION  
SELECT id, 'Web App', 'operational' FROM status_pages WHERE slug = 'sample-status';
*/

-- Success message
SELECT 'StatusLoops migration completed! 🎉' as message,
       'Created status pages, components, incidents, and notification system.' as details;
