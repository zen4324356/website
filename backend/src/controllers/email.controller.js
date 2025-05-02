const { supabase } = require('../config/supabase');

// Get email by recipient for user panel
const getEmailByRecipient = async (req, res) => {
  try {
    const { recipient } = req.query;
    
    // Find email with matching recipient
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('recipient_email', recipient)
      .single();
    
    if (error) {
      return res.status(404).json({ message: 'Email not found for this recipient' });
    }
    
    res.json({ email: data });
  } catch (error) {
    console.error('Get email by recipient error:', error);
    res.status(500).json({ message: 'Server error while fetching email' });
  }
};

// Get email statistics for admin panel
const getEmailStats = async (req, res) => {
  try {
    // Get total email count
    const { count, error } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Get most recent emails
    const { data: recentEmails, error: recentError } = await supabase
      .from('emails')
      .select('id, recipient_email, subject, date_received')
      .order('date_received', { ascending: false })
      .limit(5);
    
    if (recentError) throw recentError;
    
    // Get email count per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: dailyEmails, error: dailyError } = await supabase
      .from('emails')
      .select('date_received')
      .gte('date_received', sevenDaysAgo.toISOString());
    
    if (dailyError) throw dailyError;
    
    // Aggregate emails by day
    const dailyCounts = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyCounts[dateString] = 0;
    }
    
    dailyEmails.forEach(email => {
      const dateString = email.date_received.split('T')[0];
      if (dailyCounts[dateString] !== undefined) {
        dailyCounts[dateString]++;
      }
    });
    
    res.json({
      totalEmails: count,
      recentEmails,
      dailyEmailCounts: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ message: 'Server error while fetching email statistics' });
  }
};

// List emails with pagination for admin panel
const listEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Get emails with pagination
    const { data, error, count } = await supabase
      .from('emails')
      .select('id, recipient_email, subject, date_received', { count: 'exact' })
      .order('date_received', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      emails: data,
      pagination: {
        totalEmails: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('List emails error:', error);
    res.status(500).json({ message: 'Server error while listing emails' });
  }
};

module.exports = {
  getEmailByRecipient,
  getEmailStats,
  listEmails
}; 