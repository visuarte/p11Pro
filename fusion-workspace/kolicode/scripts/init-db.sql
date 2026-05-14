-- KoliCode Database Initialization Script
-- Run automatically when PostgreSQL container starts for the first time

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema for application
CREATE SCHEMA IF NOT EXISTS kolicode;

-- Set search path
SET search_path TO kolicode, public;

-- Create audit function for tracking changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Base tables are managed by Bridge migrations (Task 3)

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'KoliCode database initialized successfully';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm';
    RAISE NOTICE 'Schema: kolicode';
END $$;
