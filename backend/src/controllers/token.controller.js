const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');

// Generate a random token
const generateToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Get all tokens
const getAllTokens = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ tokens: data });
  } catch (error) {
    console.error('Get all tokens error:', error);
    res.status(500).json({ message: 'Server error while fetching tokens' });
  }
};

// Create a new token
const createToken = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Generate token or use provided token
    const token = req.body.token || generateToken();
    
    // Insert token into database
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        token,
        status: 'active',
        created_by: adminId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ message: 'Token already exists' });
      }
      throw error;
    }
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'create_token',
      details: { token_id: data.id }
    });
    
    res.status(201).json({ 
      message: 'Token created successfully',
      token: data
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({ message: 'Server error while creating token' });
  }
};

// Get token by ID
const getTokenById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    res.json({ token: data });
  } catch (error) {
    console.error('Get token by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching token' });
  }
};

// Update token status
const updateTokenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminEmail = req.admin.email;
    
    // Update token status
    const { data, error } = await supabase
      .from('access_tokens')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: status === 'active' ? 'activate_token' : 'block_token',
      details: { token_id: id }
    });
    
    res.json({
      message: `Token ${status === 'active' ? 'activated' : 'blocked'} successfully`,
      token: data
    });
  } catch (error) {
    console.error('Update token status error:', error);
    res.status(500).json({ message: 'Server error while updating token status' });
  }
};

// Delete token
const deleteToken = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin.email;
    
    // Get token details first for logging
    const { data: tokenData } = await supabase
      .from('access_tokens')
      .select('token')
      .eq('id', id)
      .single();
    
    // Delete token
    const { error } = await supabase
      .from('access_tokens')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(404).json({ message: 'Token not found or could not be deleted' });
    }
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'delete_token',
      details: { token_id: id, token: tokenData?.token }
    });
    
    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({ message: 'Server error while deleting token' });
  }
};

module.exports = {
  getAllTokens,
  createToken,
  getTokenById,
  updateTokenStatus,
  deleteToken
}; 