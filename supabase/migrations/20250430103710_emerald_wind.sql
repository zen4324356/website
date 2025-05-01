/*
  # Initial Schema Setup

  1. New Tables
    - `site_settings`
      - `id` (uuid, primary key)
      - `name` (text)
      - `logo_url` (text)
      - `background_video_url` (text)
      - `updated_at` (timestamp)

    - `access_tokens`
      - `id` (uuid, primary key)
      - `value` (text, unique)
      - `blocked` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
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

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings
CREATE POLICY "Allow authenticated users to read site settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admin to update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));

-- Policies for access_tokens
CREATE POLICY "Allow authenticated users to read access tokens"
  ON access_tokens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admin to manage access tokens"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));

-- Insert default site settings
INSERT INTO site_settings (name)
VALUES ('Unknown Household Access')
ON CONFLICT DO NOTHING;