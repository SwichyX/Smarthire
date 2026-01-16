-- Create recruiter_config table in Supabase
-- Run this SQL in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recruiter_config (
    id TEXT PRIMARY KEY,
    recruiter_name TEXT NOT NULL DEFAULT 'SmartHire Recruiter',
    difficulty TEXT NOT NULL DEFAULT 'Medium',
    interview_type TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    context_file TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migration commands (Run these if table already exists)
-- ALTER TABLE recruiter_config ADD COLUMN IF NOT EXISTS recruiter_name TEXT DEFAULT 'SmartHire Recruiter';
-- ALTER TABLE recruiter_config ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';
-- ALTER TABLE recruiter_config ADD COLUMN IF NOT EXISTS context_file TEXT;
-- ALTER TABLE recruiter_config DROP COLUMN IF EXISTS role;
-- ALTER TABLE recruiter_config DROP COLUMN IF EXISTS sector;

-- Enable Row Level Security
ALTER TABLE recruiter_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development)
-- In production, you should restrict this based on user authentication
CREATE POLICY "Allow all operations on recruiter_config" ON recruiter_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_recruiter_config_updated_at
    BEFORE UPDATE ON recruiter_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
