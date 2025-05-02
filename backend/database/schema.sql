-- Database schema for Admin-User Dashboard

-- Admin accounts table
CREATE TABLE admin_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Site settings table
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    website_name VARCHAR(255) DEFAULT 'Admin Dashboard',
    video_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES admin_accounts(id)
);

-- Access tokens table
CREATE TABLE access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'blocked')),
    created_by UUID REFERENCES admin_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_token CHECK (token ~* '^[A-Za-z0-9_-]{10,}$')
);

-- Index for token lookup
CREATE INDEX idx_tokens_token ON access_tokens(token);

-- Google OAuth credentials table
CREATE TABLE google_oauth_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    refresh_token TEXT,
    redirect_uri TEXT NOT NULL,
    added_by UUID REFERENCES admin_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supabase configuration table
CREATE TABLE supabase_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_url TEXT NOT NULL,
    anon_key TEXT NOT NULL,
    service_key TEXT,
    other_keys JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES admin_accounts(id)
);

-- Emails table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body TEXT,
    date_received TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    
    CONSTRAINT unique_recipient UNIQUE (recipient_email),
    CONSTRAINT valid_recipient_email CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for email lookup
CREATE INDEX idx_emails_recipient ON emails(recipient_email);

-- Admin action logs table
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_admin_email FOREIGN KEY (admin_email) REFERENCES admin_accounts(email)
);

-- Create default admin account
INSERT INTO admin_accounts (email, password) 
VALUES ('admin@example.com', '$2b$10$bYZLU5MASo6qkiYo8nAPA.Rl8ksJj.WfxUcRXOHSL844Sc9SGDa2e'); -- admin123 (hashed)

-- Create initial site settings
INSERT INTO site_settings (website_name) 
VALUES ('Admin Dashboard'); 