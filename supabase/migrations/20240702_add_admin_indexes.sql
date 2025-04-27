-- Add indexes to improve query performance on admin_credentials table
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON public.admin_credentials (username);
CREATE INDEX IF NOT EXISTS idx_admin_credentials_is_active ON public.admin_credentials (is_active); 