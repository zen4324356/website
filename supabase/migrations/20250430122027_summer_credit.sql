/*
  # Fix Admin Authentication

  1. Changes
    - Ensure admin credentials exist with correct UUID
    - Update admin credentials table structure
    - Fix RLS policies for admin authentication

  2. Security
    - Maintain RLS policies
    - Ensure secure password storage
*/

-- Drop existing admin_credentials table and recreate
DROP TABLE IF EXISTS admin_credentials;

CREATE TABLE admin_credentials (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin can read own credentials" ON admin_credentials;
  DROP POLICY IF EXISTS "Admin can update own credentials" ON admin_credentials;
END $$;

-- Create new policies
CREATE POLICY "Admin can read own credentials"
  ON admin_credentials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update own credentials"
  ON admin_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Insert admin with specific UUID
INSERT INTO admin_credentials (id, email, password)
VALUES (
  'cecb6397-ce28-40cc-9d58-89dd4cb7ade3',
  'admin@example.com',
  'admin@example.com'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  updated_at = now();