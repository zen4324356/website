/*
  # Fix Authorization Headers and Token Storage

  1. Changes
    - Add auth_token column to google_auth_credentials table
    - Update existing records
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add auth_token column
ALTER TABLE google_auth_credentials
ADD COLUMN IF NOT EXISTS auth_token text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_auth_credentials_auth_token 
ON google_auth_credentials (auth_token);