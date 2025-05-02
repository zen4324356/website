const { google } = require('googleapis');
const { supabase } = require('../config/supabase');

// Get OAuth credentials
const getOAuthCredentials = async (req, res) => {
  try {
    const adminEmail = req.admin.email;
    
    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('id, client_id, redirect_uri, created_at, last_updated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is acceptable
      throw error;
    }
    
    // We don't send the secret or refresh_token in the response
    res.json({
      hasCredentials: !!data,
      credentials: data ? {
        id: data.id,
        client_id: data.client_id,
        redirect_uri: data.redirect_uri,
        created_at: data.created_at,
        last_updated: data.last_updated,
        has_refresh_token: !!data.refresh_token
      } : null
    });
  } catch (error) {
    console.error('Get OAuth credentials error:', error);
    res.status(500).json({ message: 'Server error while fetching OAuth credentials' });
  }
};

// Save OAuth credentials
const saveOAuthCredentials = async (req, res) => {
  try {
    const { client_id, client_secret, redirect_uri } = req.body;
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Check if credentials already exist
    const { data: existingCredentials } = await supabase
      .from('google_oauth_credentials')
      .select('id, refresh_token')
      .limit(1)
      .single();
    
    let result;
    
    if (existingCredentials) {
      // Update existing but preserve refresh_token
      result = await supabase
        .from('google_oauth_credentials')
        .update({
          client_id,
          client_secret,
          redirect_uri,
          last_updated: new Date().toISOString(),
          added_by: adminId
        })
        .eq('id', existingCredentials.id)
        .select('id, client_id, redirect_uri, refresh_token, created_at, last_updated')
        .single();
    } else {
      // Create new
      result = await supabase
        .from('google_oauth_credentials')
        .insert({
          client_id,
          client_secret,
          redirect_uri,
          added_by: adminId
        })
        .select('id, client_id, redirect_uri, created_at, last_updated')
        .single();
    }
    
    if (result.error) throw result.error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: existingCredentials ? 'update_oauth_credentials' : 'add_oauth_credentials',
      details: { client_id }
    });
    
    res.json({
      message: 'OAuth credentials saved successfully',
      credentials: {
        id: result.data.id,
        client_id: result.data.client_id,
        redirect_uri: result.data.redirect_uri,
        created_at: result.data.created_at,
        last_updated: result.data.last_updated,
        has_refresh_token: !!result.data.refresh_token
      }
    });
  } catch (error) {
    console.error('Save OAuth credentials error:', error);
    res.status(500).json({ message: 'Server error while saving OAuth credentials' });
  }
};

// Generate OAuth URL
const generateOAuthUrl = async (req, res) => {
  try {
    // Get credentials from database
    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('client_id, client_secret, redirect_uri')
      .limit(1)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'OAuth credentials not found' });
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      data.client_id,
      data.client_secret,
      data.redirect_uri
    );
    
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent' // Force to get refresh token
    });
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Generate OAuth URL error:', error);
    res.status(500).json({ message: 'Server error while generating OAuth URL' });
  }
};

// Handle OAuth callback
const handleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    // Get credentials from database
    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('id, client_id, client_secret, redirect_uri')
      .limit(1)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'OAuth credentials not found' });
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      data.client_id,
      data.client_secret,
      data.redirect_uri
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return res.status(400).json({ 
        message: 'No refresh token received. Please revoke app access in Google Account and try again' 
      });
    }
    
    // Update refresh token in database
    const { error: updateError } = await supabase
      .from('google_oauth_credentials')
      .update({ 
        refresh_token: tokens.refresh_token,
        last_updated: new Date().toISOString()
      })
      .eq('id', data.id);
    
    if (updateError) throw updateError;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: req.admin.email,
      action: 'oauth_token_received',
      details: { received_at: new Date().toISOString() }
    });
    
    res.json({ 
      message: 'OAuth flow completed successfully',
      has_refresh_token: true
    });
  } catch (error) {
    console.error('Handle OAuth callback error:', error);
    res.status(500).json({ message: 'Server error during OAuth callback' });
  }
};

// Delete OAuth credentials
const deleteOAuthCredentials = async (req, res) => {
  try {
    const adminEmail = req.admin.email;
    
    // Delete credentials
    const { error } = await supabase
      .from('google_oauth_credentials')
      .delete()
      .gte('id', '0'); // Delete all records
    
    if (error) throw error;
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'delete_oauth_credentials',
      details: { deleted_at: new Date().toISOString() }
    });
    
    res.json({ message: 'OAuth credentials deleted successfully' });
  } catch (error) {
    console.error('Delete OAuth credentials error:', error);
    res.status(500).json({ message: 'Server error while deleting OAuth credentials' });
  }
};

// Refresh OAuth token
const refreshOAuthToken = async (req, res) => {
  try {
    const adminEmail = req.admin.email;
    
    // Get credentials from database
    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('client_id, client_secret, refresh_token')
      .limit(1)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'OAuth credentials not found' });
    }
    
    if (!data.refresh_token) {
      return res.status(400).json({ message: 'No refresh token available' });
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      data.client_id,
      data.client_secret
    );
    
    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: data.refresh_token
    });
    
    // Refresh access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'refresh_oauth_token',
      details: { refreshed_at: new Date().toISOString() }
    });
    
    res.json({ 
      message: 'OAuth token refreshed successfully',
      expires_at: credentials.expiry_date
    });
  } catch (error) {
    console.error('Refresh OAuth token error:', error);
    res.status(500).json({ message: 'Server error while refreshing OAuth token' });
  }
};

module.exports = {
  getOAuthCredentials,
  saveOAuthCredentials,
  generateOAuthUrl,
  handleOAuthCallback,
  deleteOAuthCredentials,
  refreshOAuthToken
}; 