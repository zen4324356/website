/*
  # Create default admin user

  1. Changes
    - Insert default admin user into admin_credentials table
    - Email: admin@example.com
    - Password: admin123 (should be changed after first login)
    
  2. Security
    - Only creates admin if none exists
    - Uses existing RLS policies
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM admin_credentials 
    WHERE email = 'admin@example.com'
  ) THEN 
    INSERT INTO admin_credentials (id, email, password)
    VALUES (
      gen_random_uuid(),
      'admin@example.com',
      'admin123'
    );
  END IF;
END $$;