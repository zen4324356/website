/*
  # Set up tables and policies

  1. New Tables
    - site_settings
    - access_tokens
    - admin_credentials

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add default admin user
*/

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Unknown Household Access',
  logo_url text,
  background_video_url text,
  updated_at timestamptz DEFAULT now()
);

-- Create access_tokens table
CREATE TABLE IF NOT EXISTS access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text UNIQUE NOT NULL,
  blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to read site settings" ON site_settings;
  DROP POLICY IF EXISTS "Allow authenticated admin to update site settings" ON site_settings;
  DROP POLICY IF EXISTS "Allow authenticated users to read access tokens" ON access_tokens;
  DROP POLICY IF EXISTS "Allow authenticated admin to manage access tokens" ON access_tokens;
  DROP POLICY IF EXISTS "Admin can read own credentials" ON admin_credentials;
  DROP POLICY IF EXISTS "Admin can update own credentials" ON admin_credentials;
END $$;

-- Recreate policies for site_settings
CREATE POLICY "Allow authenticated users to read site settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admin to update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Recreate policies for access_tokens
CREATE POLICY "Allow authenticated users to read access tokens"
  ON access_tokens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admin to manage access tokens"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Recreate policies for admin_credentials
CREATE POLICY "Admin can read own credentials"
  ON admin_credentials
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admin can update own credentials"
  ON admin_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Insert default site settings
INSERT INTO site_settings (name)
VALUES ('Unknown Household Access')
ON CONFLICT DO NOTHING;

-- Insert default admin credentials
INSERT INTO admin_credentials (email, password)
VALUES ('admin@example.com', 'admin@example.com')
ON CONFLICT DO NOTHING;