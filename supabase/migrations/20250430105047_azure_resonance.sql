/*
  # Add initial site settings and access token

  1. Changes
    - Insert initial site settings row
    - Insert initial access token '1234'
    
  2. Security
    - No changes to existing RLS policies
*/

-- Insert initial site settings if none exist
INSERT INTO site_settings (name)
SELECT 'Household Access'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- Insert access token if it doesn't exist
INSERT INTO access_tokens (value, blocked)
SELECT '1234', false
WHERE NOT EXISTS (SELECT 1 FROM access_tokens WHERE value = '1234');