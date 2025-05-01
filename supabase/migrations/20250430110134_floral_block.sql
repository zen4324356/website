/*
  # Fix admin authentication and access tokens

  1. Changes
    - Create admin user with proper email format
    - Ensure access token exists and is active
    - Update RLS policies
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
    'Admin123@admin.com',
    crypt('Admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'Admin123@admin.com'
  );
END $$;

-- Ensure the access token exists and is active
INSERT INTO access_tokens (value, blocked)
VALUES ('1234', false)
ON CONFLICT (value) 
DO UPDATE SET blocked = false;

-- Update RLS policies for better access control
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access token verification" ON access_tokens;
CREATE POLICY "Allow public access token verification"
  ON access_tokens
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin to manage access tokens" ON access_tokens;
CREATE POLICY "Allow authenticated admin to manage access tokens"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (true);

-- Ensure site settings exist
INSERT INTO site_settings (name)
VALUES ('Unknown Household Access')
ON CONFLICT DO NOTHING;