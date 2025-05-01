/*
  # Set up admin authentication with specific credentials

  1. Changes
    - Create admin user with specified email and password
    - Update RLS policies for better access control
*/

-- Create admin user with specified credentials
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
    'Akshay1234@gmail.com',
    crypt('Akshay1234', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'Akshay1234@gmail.com'
  );
END $$;

-- Update RLS policies for better access control
DROP POLICY IF EXISTS "Allow authenticated admin to update site settings" ON site_settings;
CREATE POLICY "Allow authenticated admin to update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'Akshay1234@gmail.com');

DROP POLICY IF EXISTS "Allow authenticated admin to manage access tokens" ON access_tokens;
CREATE POLICY "Allow authenticated admin to manage access tokens"
  ON access_tokens
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'Akshay1234@gmail.com');