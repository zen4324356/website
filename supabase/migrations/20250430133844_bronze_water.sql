/*
  # Fix Token Management

  1. Changes
    - Update RLS policies for access_tokens table
    - Add explicit policies for each operation
    - Fix token management for admin

  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON access_tokens;
DROP POLICY IF EXISTS "Enable token management for admin" ON access_tokens;

-- Create separate policies for each operation
CREATE POLICY "Allow public token verification"
  ON access_tokens
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin to insert tokens"
  ON access_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Allow admin to update tokens"
  ON access_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Allow admin to delete tokens"
  ON access_tokens
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Ensure RLS is enabled
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;