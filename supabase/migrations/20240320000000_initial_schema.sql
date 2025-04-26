-- Create tables for admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_limit INTEGER NOT NULL DEFAULT 10,
    auto_refresh_enabled BOOLEAN NOT NULL DEFAULT false,
    auto_refresh_interval INTEGER NOT NULL DEFAULT 60000,
    default_search_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for server storage stats
CREATE TABLE IF NOT EXISTS server_storage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_emails INTEGER NOT NULL DEFAULT 0,
    storage_size TEXT NOT NULL DEFAULT '0 MB',
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for server emails
CREATE TABLE IF NOT EXISTS server_emails (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    email_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for access tokens
CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Google OAuth configs
CREATE TABLE IF NOT EXISTS google_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    project_id TEXT,
    auth_uri TEXT DEFAULT 'https://accounts.google.com/o/oauth2/auth',
    token_uri TEXT DEFAULT 'https://oauth2.googleapis.com/token',
    auth_provider_cert_url TEXT DEFAULT 'https://www.googleapis.com/oauth2/v1/certs',
    is_active BOOLEAN NOT NULL DEFAULT true,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_storage_stats_updated_at
    BEFORE UPDATE ON server_storage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_emails_updated_at
    BEFORE UPDATE ON server_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_tokens_updated_at
    BEFORE UPDATE ON access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_configs_updated_at
    BEFORE UPDATE ON google_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin settings
INSERT INTO admin_settings (email_limit, auto_refresh_enabled, auto_refresh_interval, default_search_email)
VALUES (10, false, 60000, NULL)
ON CONFLICT DO NOTHING;

-- Insert initial server storage stats
INSERT INTO server_storage_stats (total_emails, storage_size, last_updated)
VALUES (0, '0 MB', NULL)
ON CONFLICT DO NOTHING; 