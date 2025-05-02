const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt with:', { email, password });
    
    // Check if admin exists
    const { data: admin, error } = await supabase
      .from('admin_accounts')
      .select('id, email, password')
      .eq('email', email)
      .single();
    
    if (error || !admin) {
      console.log('Admin not found or error:', error);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Direct plain text password comparison instead of bcrypt
    const isPasswordValid = password === admin.password;
    
    if (!isPasswordValid) {
      console.log('Password mismatch. Expected:', admin.password, 'Got:', password);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: admin.email,
      action: 'login',
      details: { ip: req.ip }
    });
    
    console.log('Login successful for:', email);
    
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Token login
const tokenLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Check if token exists and is active
    const { data, error } = await supabase
      .from('access_tokens')
      .select('id, token, status')
      .eq('token', token)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      return res.status(401).json({ message: 'Invalid or inactive token' });
    }
    
    // Update last login time
    await supabase
      .from('access_tokens')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);
    
    res.json({
      message: 'Token login successful',
      token: data.token
    });
  } catch (error) {
    console.error('Token login error:', error);
    res.status(500).json({ message: 'Server error during token login' });
  }
};

// Update admin password
const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminEmail = req.admin.email;
    
    console.log('Update password attempt for:', adminEmail);
    
    // Check current admin
    const { data: admin, error } = await supabase
      .from('admin_accounts')
      .select('id, password')
      .eq('email', adminEmail)
      .single();
    
    if (error || !admin) {
      console.log('Admin not found or error:', error);
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Direct plain text password comparison
    const isPasswordValid = currentPassword === admin.password;
    if (!isPasswordValid) {
      console.log('Current password mismatch');
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Store new password directly as plain text, no hashing
    await supabase
      .from('admin_accounts')
      .update({ 
        password: newPassword,
        last_updated: new Date().toISOString()
      })
      .eq('id', admin.id);
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: adminEmail,
      action: 'password_update',
      details: { ip: req.ip }
    });
    
    console.log('Password updated successfully for:', adminEmail);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error during password update' });
  }
};

// Update admin email
const updateAdminEmail = async (req, res) => {
  try {
    const { password, newEmail } = req.body;
    const currentEmail = req.admin.email;
    
    console.log('Update email attempt from:', currentEmail, 'to:', newEmail);
    
    // Check current admin
    const { data: admin, error } = await supabase
      .from('admin_accounts')
      .select('id, password')
      .eq('email', currentEmail)
      .single();
    
    if (error || !admin) {
      console.log('Admin not found or error:', error);
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Direct plain text password comparison
    const isPasswordValid = password === admin.password;
    if (!isPasswordValid) {
      console.log('Password mismatch for email update');
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    
    // Check if new email is already used
    const { data: existingAdmin } = await supabase
      .from('admin_accounts')
      .select('id')
      .eq('email', newEmail)
      .maybeSingle();
    
    if (existingAdmin) {
      return res.status(409).json({ message: 'Email is already in use' });
    }
    
    // Update email
    await supabase
      .from('admin_accounts')
      .update({ 
        email: newEmail,
        last_updated: new Date().toISOString()
      })
      .eq('id', admin.id);
    
    // Update admin_logs foreign key
    await supabase.rpc('update_admin_logs_email', { 
      old_email: currentEmail, 
      new_email: newEmail 
    });
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_email: newEmail,
      action: 'email_update',
      details: { old_email: currentEmail, ip: req.ip }
    });
    
    // Generate new JWT
    const token = jwt.sign(
      { id: admin.id, email: newEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({ 
      message: 'Email updated successfully',
      token,
      admin: {
        id: admin.id,
        email: newEmail
      }
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ message: 'Server error during email update' });
  }
};

// Get admin status
const getAdminStatus = async (req, res) => {
  try {
    res.json({
      message: 'Admin authenticated',
      admin: {
        id: req.admin.id,
        email: req.admin.email
      }
    });
  } catch (error) {
    console.error('Get admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  tokenLogin,
  updateAdminPassword,
  updateAdminEmail,
  getAdminStatus
}; 