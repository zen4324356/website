-- Drop the table if it exists and recreate
DROP TABLE IF EXISTS public.admin_credentials;

-- Create admins table
CREATE TABLE public.admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Insert default admin first before enabling RLS
INSERT INTO public.admin_credentials (username, password)
VALUES ('Admin@Akshay', 'Admin@Akshay');

-- Then enable RLS and create policies
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only authenticated users can select admin_credentials"
  ON public.admin_credentials
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only superadmins can modify admin_credentials"
  ON public.admin_credentials
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.admin_credentials WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_credentials WHERE is_active = true));

-- Add indexes to improve query performance on admin_credentials table
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON public.admin_credentials (username);
CREATE INDEX IF NOT EXISTS idx_admin_credentials_is_active ON public.admin_credentials (is_active); 