/*
  # Add password history support

  1. Changes
    - Add password_history column to admin_credentials table
    - Update existing records with empty history array
    
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE admin_credentials
ADD COLUMN IF NOT EXISTS password_history jsonb[] DEFAULT ARRAY[]::jsonb[];

-- Update existing records to have empty password history if null
UPDATE admin_credentials 
SET password_history = ARRAY[]::jsonb[] 
WHERE password_history IS NULL;