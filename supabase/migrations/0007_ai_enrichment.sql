-- Migration: AI v1 enrichment (transcript, summary, sentiment, tags, captions)
-- Adds AI fields to testimonials and introduces ai_jobs queue table

-- Add new AI columns to testimonials
ALTER TABLE IF EXISTS testimonials
    ADD COLUMN IF NOT EXISTS transcript TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS sentiment TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[],
    ADD COLUMN IF NOT EXISTS captions_url TEXT;

-- AI jobs queue table
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, done, failed
    error TEXT,
    created_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update updated_utc on change
CREATE OR REPLACE FUNCTION update_updated_utc_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_utc = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_jobs_updated_utc'
    ) THEN
        CREATE TRIGGER update_ai_jobs_updated_utc
            BEFORE UPDATE ON ai_jobs
            FOR EACH ROW EXECUTE FUNCTION update_updated_utc_column();
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_jobs_testimonial_id ON ai_jobs(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);

-- Success message
-- SELECT 'AI enrichment migration completed' AS message;
