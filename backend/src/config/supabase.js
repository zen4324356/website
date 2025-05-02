require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with anonymous key (for public operations)
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Supabase client with service key (for admin operations)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Dynamic client creation (read from database)
const getDynamicSupabaseClient = async () => {
  try {
    // First check if we have credentials in the database
    const { data, error } = await supabase
      .from('supabase_config')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    
    if (data) {
      return createClient(data.project_url, data.service_key || data.anon_key);
    }
    
    // If no config in database, use environment variables
    return supabase;
  } catch (error) {
    console.error('Error getting Supabase configuration:', error);
    return supabase;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  getDynamicSupabaseClient
}; 