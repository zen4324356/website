require('dotenv').config();
const { supabase } = require('./config/supabase');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Plain text password - no encryption
    const plainPassword = 'admin123';
    
    // Check if admin exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_accounts')
      .select('id')
      .eq('email', 'admin@example.com')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing admin:', checkError);
      console.error('Make sure your Supabase RLS policies allow you to read the admin_accounts table');
      return;
    }
    
    // If admin doesn't exist, create one with plain text password
    if (!existingAdmin) {
      console.log('Creating default admin account with plain text password...');
      const { data, error } = await supabase
        .from('admin_accounts')
        .insert({
          email: 'admin@example.com',
          password: plainPassword  // Plain text password
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating admin account:', error);
        console.error('Make sure your Supabase RLS policies allow you to insert into the admin_accounts table');
        return;
      }
      
      console.log('Default admin account created successfully:');
      console.log('- Email: admin@example.com');
      console.log('- Password: admin123');
    } else {
      console.log('Admin account already exists. Preserving existing credentials.');
    }
    
    // Create initial site settings if they don't exist
    const { data: existingSettings, error: settingsCheckError } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    if (settingsCheckError) {
      console.error('Error checking for existing settings:', settingsCheckError);
      console.error('Make sure your Supabase RLS policies allow you to read the site_settings table');
      return;
    }
    
    if (!existingSettings) {
      console.log('Creating initial site settings...');
      const { error: settingsError } = await supabase
        .from('site_settings')
        .insert({
          website_name: 'Admin Dashboard'
        });
        
      if (settingsError) {
        console.error('Error creating site settings:', settingsError);
        console.error('Make sure your Supabase RLS policies allow you to insert into the site_settings table');
        return;
      }
      
      console.log('Initial site settings created successfully.');
    } else {
      console.log('Site settings already exist.');
    }
    
    console.log('Database seeding completed successfully!');
    
    // Instructions for RLS policies
    console.log('\nNOTE: Make sure to enable the following RLS policies in Supabase:');
    console.log('1. To enable RLS without restrictions (allow all operations):\n');
    console.log('-- For admin_accounts table:');
    console.log('CREATE POLICY "Enable all operations for all users" ON admin_accounts');
    console.log('    USING (true)');
    console.log('    WITH CHECK (true);\n');
    
    console.log('-- For site_settings table:');
    console.log('CREATE POLICY "Enable all operations for all users" ON site_settings');
    console.log('    USING (true)');
    console.log('    WITH CHECK (true);\n');
    
    console.log('-- For access_tokens table:');
    console.log('CREATE POLICY "Enable all operations for all users" ON access_tokens');
    console.log('    USING (true)');
    console.log('    WITH CHECK (true);\n');
    
    console.log('-- For all other tables, apply similar policies.\n');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedDatabase(); 