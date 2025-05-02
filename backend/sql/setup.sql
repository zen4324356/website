-- Enable Row Level Security but allow all operations
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations
-- Admin accounts policy
CREATE POLICY "Enable all operations for all users" ON admin_accounts
  USING (true)
  WITH CHECK (true);

-- Site settings policy
CREATE POLICY "Enable all operations for all users" ON site_settings
  USING (true)
  WITH CHECK (true);

-- Access tokens policy
CREATE POLICY "Enable all operations for all users" ON access_tokens
  USING (true)
  WITH CHECK (true);

-- Google OAuth credentials policy
CREATE POLICY "Enable all operations for all users" ON google_oauth_credentials
  USING (true)
  WITH CHECK (true);

-- Supabase config policy
CREATE POLICY "Enable all operations for all users" ON supabase_config
  USING (true)
  WITH CHECK (true);

-- Emails policy
CREATE POLICY "Enable all operations for all users" ON emails
  USING (true)
  WITH CHECK (true);

-- Admin logs policy
CREATE POLICY "Enable all operations for all users" ON admin_logs
  USING (true)
  WITH CHECK (true);

-- Insert default admin account only if no admin accounts exist
INSERT INTO admin_accounts (email, password) 
SELECT 'admin@example.com', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM admin_accounts);

-- Insert initial site settings if needed
INSERT INTO site_settings (website_name) 
VALUES ('Admin Dashboard')
ON CONFLICT DO NOTHING;

-- Display the admin account for verification
SELECT * FROM admin_accounts; 