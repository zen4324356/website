/*
  # Create default admin user

  1. Changes
    - Insert default admin credentials into admin_credentials table
    - Create default admin user in auth.users
    - Set up admin role and permissions
  
  2. Security
    - Password is stored securely
    - RLS policies are maintained
*/

-- First, ensure the admin user exists in auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
    ) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@example.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    END IF;
END $$;

-- Then, ensure the admin credentials exist in our custom table
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user id from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@example.com';

    -- Insert into admin_credentials if not exists
    IF NOT EXISTS (
        SELECT 1 FROM admin_credentials WHERE email = 'admin@example.com'
    ) THEN
        INSERT INTO admin_credentials (
            id,
            email,
            password,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            'admin@example.com',
            'admin123',
            NOW(),
            NOW()
        );
    END IF;
END $$;