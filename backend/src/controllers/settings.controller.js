const { supabase } = require('../config/supabase');

// Get all settings (admin only)
const getAllSettings = async (req, res) => {
  try {
    // Get site settings
    const { data: siteSettings, error: siteError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (siteError && siteError.code !== 'PGRST116') { // Not found error is acceptable
      throw siteError;
    }
    
    // Get Supabase config
    const { data: supabaseConfig, error: supabaseError } = await supabase
      .from('supabase_config')
      .select('*')
      .limit(1)
      .single();
    
    if (supabaseError && supabaseError.code !== 'PGRST116') { // Not found error is acceptable
      throw supabaseError;
    }
    
    res.json({
      siteSettings: siteSettings || {},
      supabaseConfig: supabaseConfig ? {
        project_url: supabaseConfig.project_url,
        anon_key: supabaseConfig.anon_key,
        service_key: supabaseConfig.service_key,
        other_keys: supabaseConfig.other_keys
      } : {}
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
};

// Get public settings (no auth required)
const getPublicSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('website_name, logo_url, video_url')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error is acceptable
      throw error;
    }
    
    res.json({
      settings: data || { 
        website_name: 'Admin Dashboard', 
        logo_url: null, 
        video_url: null 
      }
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error while fetching public settings' });
  }
};

// Update website name
const updateWebsiteName = async (req, res) => {
  try {
    const { website_name } = req.body;
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing
      result = await supabase
        .from('site_settings')
        .update({ 
          website_name,
          last_updated: new Date().toISOString(),
          updated_by: adminId
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('site_settings')
        .insert({ 
          website_name,
          updated_by: adminId
        })
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'update_website_name',
      details: { website_name }
    });
    
    res.json({
      message: 'Website name updated successfully',
      settings: result.data
    });
  } catch (error) {
    console.error('Update website name error:', error);
    res.status(500).json({ message: 'Server error while updating website name' });
  }
};

// Update logo URL
const updateLogoUrl = async (req, res) => {
  try {
    const { logo_url } = req.body;
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing
      result = await supabase
        .from('site_settings')
        .update({ 
          logo_url,
          last_updated: new Date().toISOString(),
          updated_by: adminId
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('site_settings')
        .insert({ 
          logo_url,
          updated_by: adminId
        })
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'update_logo_url',
      details: { logo_url }
    });
    
    res.json({
      message: 'Logo URL updated successfully',
      settings: result.data
    });
  } catch (error) {
    console.error('Update logo URL error:', error);
    res.status(500).json({ message: 'Server error while updating logo URL' });
  }
};

// Update video URL
const updateVideoUrl = async (req, res) => {
  try {
    const { video_url } = req.body;
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing
      result = await supabase
        .from('site_settings')
        .update({ 
          video_url,
          last_updated: new Date().toISOString(),
          updated_by: adminId
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('site_settings')
        .insert({ 
          video_url,
          updated_by: adminId
        })
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'update_video_url',
      details: { video_url }
    });
    
    res.json({
      message: 'Video URL updated successfully',
      settings: result.data
    });
  } catch (error) {
    console.error('Update video URL error:', error);
    res.status(500).json({ message: 'Server error while updating video URL' });
  }
};

// Update Supabase configuration
const updateSupabaseConfig = async (req, res) => {
  try {
    const { project_url, anon_key, service_key } = req.body;
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('supabase_config')
      .select('id')
      .limit(1)
      .single();
    
    let result;
    
    if (existingConfig) {
      // Update existing
      result = await supabase
        .from('supabase_config')
        .update({ 
          project_url,
          anon_key,
          service_key,
          last_updated: new Date().toISOString(),
          updated_by: adminId
        })
        .eq('id', existingConfig.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('supabase_config')
        .insert({ 
          project_url,
          anon_key,
          service_key,
          updated_by: adminId
        })
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'update_supabase_config',
      details: { project_url }
    });
    
    res.json({
      message: 'Supabase configuration updated successfully',
      config: {
        project_url: result.data.project_url,
        anon_key: result.data.anon_key,
        // Don't return service key in response for security
        has_service_key: !!result.data.service_key
      }
    });
  } catch (error) {
    console.error('Update Supabase config error:', error);
    res.status(500).json({ message: 'Server error while updating Supabase configuration' });
  }
};

module.exports = {
  getAllSettings,
  getPublicSettings,
  updateWebsiteName,
  updateLogoUrl,
  updateVideoUrl,
  updateSupabaseConfig
}; 