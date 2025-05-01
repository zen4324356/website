/*
  # Fix Token Management and Authentication

  1. Changes
    - Update RLS policies for access_tokens table
    - Fix token verification policies
    - Ensure proper token management for admin

  2. Security
    - Maintain RLS while allowing proper access
    - Enable token verification for users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read access tokens" ON access_tokens;
DROP POLICY IF EXISTS "Allow authenticated admin to manage access tokens" ON access_tokens;
DROP POLICY IF EXISTS "Allow public access token verification" ON access_tokens;

-- Create new policies for access_tokens
CREATE POLICY "Enable read access for all users"
  ON access_tokens
  FOR SELECT
  USING (true);

CREATE POLICY "Enable token management for admin"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_credentials 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Ensure the table has RLS enabled
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;