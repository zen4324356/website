-- Create server_emails table
CREATE TABLE IF NOT EXISTS server_emails (
  id TEXT PRIMARY KEY,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  date TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  matched_in TEXT,
  extracted_recipients TEXT[],
  raw_match JSONB,
  is_forwarded_email BOOLEAN DEFAULT false,
  is_cluster BOOLEAN DEFAULT false,
  is_domain_forwarded BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_grouped BOOLEAN DEFAULT false,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_storage_stats table
CREATE TABLE IF NOT EXISTS server_storage_stats (
  id SERIAL PRIMARY KEY,
  total_emails INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storage_size TEXT DEFAULT '0 MB',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_server_emails_domain ON server_emails(domain);

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS idx_server_emails_date ON server_emails(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for server_emails
CREATE TRIGGER update_server_emails_updated_at
  BEFORE UPDATE ON server_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for server_storage_stats
CREATE TRIGGER update_server_storage_stats_updated_at
  BEFORE UPDATE ON server_storage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 