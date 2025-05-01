/*
  # Fix Token Verification

  1. Changes
    - Update RLS policies for better token verification
    - Add index on value column for faster lookups
    
  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
*/

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_access_tokens_value ON access_tokens (value);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public token verification" ON access_tokens;
DROP POLICY IF EXISTS "Allow admin to insert tokens" ON access_tokens;
DROP POLICY IF EXISTS "Allow admin to update tokens" ON access_tokens;
DROP POLICY IF EXISTS "Allow admin to delete tokens" ON access_tokens;

-- Create new policies with proper verification
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