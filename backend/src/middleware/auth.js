const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Middleware to authenticate admin users
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this admin exists in the database
    const { data: admin, error } = await supabase
      .from('admin_accounts')
      .select('id, email')
      .eq('email', decoded.email)
      .single();
    
    if (error || !admin) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach admin info to request
    req.admin = {
      id: admin.id,
      email: admin.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to authenticate access tokens
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
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
    
    // Attach token info to request
    req.token = {
      id: data.id,
      token: data.token
    };
    
    next();
  } catch (error) {
    console.error('Token auth error:', error);
    return res.status(500).json({ message: 'Server error during token authentication' });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateToken
}; 