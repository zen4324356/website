-- Drop existing server_storage_stats table if it exists
DROP TABLE IF EXISTS server_storage_stats;

-- Create server_storage_stats table with correct structure
CREATE TABLE server_storage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_emails INTEGER NOT NULL DEFAULT 0,
    storage_size TEXT NOT NULL DEFAULT '0 MB',
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create trigger for updated_at
CREATE TRIGGER update_server_storage_stats_updated_at
    BEFORE UPDATE ON server_storage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial stats
INSERT INTO server_storage_stats (total_emails, storage_size, last_updated)
VALUES (0, '0 MB', NULL)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON server_storage_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON server_storage_stats TO service_role; 