/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE SCHEMA IF NOT EXISTS kolicode;
    SET search_path TO kolicode, public;

    CREATE OR REPLACE FUNCTION kolicode.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS kolicode.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash TEXT,
      auth_provider VARCHAR(50) DEFAULT 'local',
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kolicode.projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id UUID REFERENCES kolicode.users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      project_type VARCHAR(50) NOT NULL DEFAULT 'design',
      canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kolicode.assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES kolicode.projects(id) ON DELETE CASCADE,
      owner_id UUID REFERENCES kolicode.users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      asset_type VARCHAR(50) NOT NULL DEFAULT 'binary',
      format VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'queued',
      storage_path TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kolicode.audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      actor_user_id UUID REFERENCES kolicode.users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100),
      resource_id UUID,
      severity VARCHAR(20) NOT NULL DEFAULT 'info',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_users_email_trgm
      ON kolicode.users USING gin (email gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_projects_owner_id
      ON kolicode.projects (owner_id);
    CREATE INDEX IF NOT EXISTS idx_assets_project_id
      ON kolicode.assets (project_id);
    CREATE INDEX IF NOT EXISTS idx_assets_status
      ON kolicode.assets (status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
      ON kolicode.audit_logs (action, created_at DESC);

    DROP TRIGGER IF EXISTS trigger_users_updated_at ON kolicode.users;
    CREATE TRIGGER trigger_users_updated_at
      BEFORE UPDATE ON kolicode.users
      FOR EACH ROW EXECUTE FUNCTION kolicode.update_updated_at_column();

    DROP TRIGGER IF EXISTS trigger_projects_updated_at ON kolicode.projects;
    CREATE TRIGGER trigger_projects_updated_at
      BEFORE UPDATE ON kolicode.projects
      FOR EACH ROW EXECUTE FUNCTION kolicode.update_updated_at_column();

    DROP TRIGGER IF EXISTS trigger_assets_updated_at ON kolicode.assets;
    CREATE TRIGGER trigger_assets_updated_at
      BEFORE UPDATE ON kolicode.assets
      FOR EACH ROW EXECUTE FUNCTION kolicode.update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS kolicode.audit_logs;
    DROP TABLE IF EXISTS kolicode.assets;
    DROP TABLE IF EXISTS kolicode.projects;
    DROP TABLE IF EXISTS kolicode.users;
    DROP FUNCTION IF EXISTS kolicode.update_updated_at_column();
  `);
};
