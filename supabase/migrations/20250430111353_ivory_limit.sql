/*
  # Set up authentication schema

  1. Changes
    - Enable authentication
    - Set up auth schema and tables
    - Add policies for auth tables
  
  2. Security
    - Enable RLS on auth tables
    - Add policies for authenticated users
*/

-- Enable authentication
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies for auth tables
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON auth.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add email constraint for admin
DO $$ 
BEGIN
  -- Check if the admin user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'Akshay1234@gmail.com'
  ) THEN
    -- Create the admin user if it doesn't exist
    INSERT INTO auth.users (
      email,
      role,
      is_super_admin
    ) VALUES (
      'Akshay1234@gmail.com',
      'admin',
      true
    );
  END IF;
END $$;