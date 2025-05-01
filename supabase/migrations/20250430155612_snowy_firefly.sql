/*
  # Add Google OAuth Credentials Management

  1. New Tables
    - `google_auth_credentials`
      - `id` (uuid, primary key)
      - `client_id` (text)
      - `client_secret` (text)
      - `project_id` (text)
      - `auth_uri` (text)
      - `token_uri` (text)
      - `auth_provider_cert_url` (text)
      - `redirect_uris` (text[])
      - `javascript_origins` (text[])
      - `authorized` (boolean)
      - `access_token` (text)
      - `refresh_token` (text)
      - `token_expiry` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS google_auth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  project_id text NOT NULL,
  auth_uri text NOT NULL,
  token_uri text NOT NULL,
  auth_provider_cert_url text NOT NULL,
  redirect_uris text[] NOT NULL,
  javascript_origins text[] NOT NULL,
  authorized boolean DEFAULT false,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE google_auth_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin to manage google auth credentials"
  ON google_auth_credentials
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');