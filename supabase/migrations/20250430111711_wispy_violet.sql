/*
  # Add admin credentials table and policies

  1. New Tables
    - `admin_credentials`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_credentials` table
    - Add policy for admin to read and update their own data
*/

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can read own credentials"
  ON admin_credentials
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admin can update own credentials"
  ON admin_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Insert initial admin user if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_credentials WHERE email = 'Akshay1234@gmail.com') THEN
    INSERT INTO admin_credentials (email) VALUES ('Akshay1234@gmail.com');
  END IF;
END $$;