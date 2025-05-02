const { supabase } = require('../config/supabase');

// Get admin dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    // Get counts for dashboard widgets
    const [
      tokensResult,
      activeTokensResult,
      emailsResult,
      logsResult,
      siteSettingsResult
    ] = await Promise.all([
      // Total tokens
      supabase.from('access_tokens').select('*', { count: 'exact', head: true }),
      
      // Active tokens
      supabase.from('access_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Total emails
      supabase.from('emails').select('*', { count: 'exact', head: true }),
      
      // Recent admin logs
      supabase.from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5),
      
      // Site settings
      supabase.from('site_settings').select('*').limit(1).single()
    ]);
    
    // Get recent logins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLoginsResult = await supabase
      .from('access_tokens')
      .select('last_login_at')
      .gte('last_login_at', sevenDaysAgo.toISOString())
      .order('last_login_at', { ascending: false });
    
    // Check for errors
    if (tokensResult.error || activeTokensResult.error || emailsResult.error || 
        logsResult.error || siteSettingsResult.error || recentLoginsResult.error) {
      throw new Error('Error fetching dashboard data');
    }
    
    res.json({
      summary: {
        totalTokens: tokensResult.count || 0,
        activeTokens: activeTokensResult.count || 0,
        blockedTokens: (tokensResult.count || 0) - (activeTokensResult.count || 0),
        totalEmails: emailsResult.count || 0,
        recentLogins: recentLoginsResult.data?.length || 0
      },
      recentLogs: logsResult.data || [],
      siteSettings: siteSettingsResult.data || {}
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard summary' });
  }
};

// Get admin logs
const getAdminLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Get logs with pagination
    const { data, error, count } = await supabase
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      logs: data,
      pagination: {
        totalLogs: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ message: 'Server error while fetching admin logs' });
  }
};

// Get admin account info
const getAdminAccount = async (req, res) => {
  try {
    const adminEmail = req.admin.email;
    
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('id, email, last_updated')
      .eq('email', adminEmail)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      admin: data
    });
  } catch (error) {
    console.error('Get admin account error:', error);
    res.status(500).json({ message: 'Server error while fetching admin account' });
  }
};

// Add an admin log
const addAdminLog = async (req, res) => {
  try {
    const { action, details } = req.body;
    const adminEmail = req.admin.email;
    
    const { data, error } = await supabase
      .from('admin_logs')
      .insert({
        admin_email: adminEmail,
        action,
        details,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      message: 'Admin log added',
      log: data
    });
  } catch (error) {
    console.error('Add admin log error:', error);
    res.status(500).json({ message: 'Server error while adding admin log' });
  }
};

module.exports = {
  getDashboardSummary,
  getAdminLogs,
  getAdminAccount,
  addAdminLog
}; 