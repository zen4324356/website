/*
  # Fix Token Management Policies

  1. Changes
    - Update RLS policies for access_tokens table
    - Ensure proper admin access to tokens
    - Fix token verification for users

  2. Security
    - Maintain RLS enabled
    - Update policies for better access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON access_tokens;
DROP POLICY IF EXISTS "Enable token management for admin" ON access_tokens;

-- Create new policies for access_tokens
CREATE POLICY "Enable read access for all users"
  ON access_tokens
  FOR SELECT
  USING (true);

CREATE POLICY "Enable token management for admin"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Ensure RLS is enabled
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;