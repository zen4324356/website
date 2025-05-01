/*
  # Fix Admin Authentication

  1. Changes
    - Drop existing admin_credentials table
    - Create new admin_credentials table with password field
    - Add default admin user
    - Update RLS policies

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Drop existing table
DROP TABLE IF EXISTS admin_credentials;

-- Create new admin_credentials table with password
CREATE TABLE admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Insert default admin (email: admin@example.com, password: admin123)
INSERT INTO admin_credentials (email, password)
VALUES ('admin@example.com', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password;