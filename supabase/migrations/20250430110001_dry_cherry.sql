/*
  # Fix Authentication Setup

  1. Changes
    - Create admin user with credentials
    - Ensure access token exists and is active
    - Add necessary RLS policies
*/

-- Create admin user if it doesn't exist
DO $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'Admin123',
    crypt('Admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'Admin123'
  );
END $$;

-- Ensure the access token exists and is active
INSERT INTO access_tokens (value, blocked)
VALUES ('1234', false)
ON CONFLICT (value) 
DO UPDATE SET blocked = false;

-- Update site settings policies to allow insertion
DROP POLICY IF EXISTS "Allow authenticated users to insert site settings" ON site_settings;
CREATE POLICY "Allow authenticated users to insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure default site settings exist
INSERT INTO site_settings (name)
VALUES ('Unknown Household Access')
ON CONFLICT DO NOTHING;