import { useState, useEffect } from 'react';
import { emailApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import {
  EnvelopeIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const EmailStats = () => {
  const [emailStats, setEmailStats] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEmails: 0,
    limit: 10
  });

  // Fetch stats on mount
  useEffect(() => {
    fetchEmailStats();
    fetchEmails(1);
  }, []);

  // Fetch email statistics
  const fetchEmailStats = async () => {
    try {
      setIsLoadingStats(true);
      const { data } = await emailApi.getEmailStats();
      setEmailStats(data);
    } catch (error) {
      console.error('Error fetching email stats:', error);
      toast.error('Failed to load email statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch emails with pagination
  const fetchEmails = async (page) => {
    try {
      setIsLoadingEmails(true);
      const { data } = await emailApi.listEmails(page, pagination.limit);
      setEmails(data.emails || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchEmails(page);
  };

  // Format date 
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Prepare chart data for display
  const getChartData = () => {
    if (!emailStats?.dailyEmailCounts) return [];
    
    return emailStats.dailyEmailCounts;
  };

  // Calculate chart max value for scaling
  const getChartMaxValue = () => {
    if (!emailStats?.dailyEmailCounts) return 10;
    
    const maxCount = Math.max(...emailStats.dailyEmailCounts.map(d => d.count));
    return Math.max(maxCount, 1);
  };

  // Table columns
  const columns = [
    { 
      header: 'Recipient', 
      accessor: 'recipient_email',
      render: (row) => (
        <div className="flex items-center">
          <EnvelopeIcon className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0" />
          <span className="font-mono text-xs truncate">{row.recipient_email}</span>
        </div>
      )
    },
    { 
      header: 'Subject', 
      accessor: 'subject',
      render: (row) => (
        <div className="truncate max-w-xs">
          {row.subject || '(No Subject)'}
        </div>
      )
    },
    { 
      header: 'Received', 
      accessor: 'date_received',
      render: (row) => (
        <div className="flex items-center text-xs">
          <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
          {formatDate(row.date_received)}
        </div>
      )
    }
  ];

  // Loading state for stats
  if (isLoadingStats) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-white mb-6">Email Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-32 bg-dark-lighter rounded-lg shadow"></div>
          ))}
        </div>
        <div className="h-64 bg-dark-lighter rounded-lg shadow mb-6"></div>
        <div className="h-96 bg-dark-lighter rounded-lg shadow"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Email Statistics</h1>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex flex-col justify-between">
          <h3 className="text-lg font-medium text-white">Total Emails</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-semibold text-white">
              {emailStats?.totalEmails || 0}
            </p>
            <EnvelopeIcon className="h-8 w-8 text-primary-500" />
          </div>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <h3 className="text-lg font-medium text-white">Recent Emails</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-semibold text-white">
              {emailStats?.recentEmails?.length || 0}
            </p>
            <CalendarIcon className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <h3 className="text-lg font-medium text-white">Daily Average</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-semibold text-white">
              {emailStats?.dailyEmailCounts ? 
                (emailStats.dailyEmailCounts.reduce((sum, day) => sum + day.count, 0) / 7).toFixed(1) 
                : 0}
            </p>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>
      
      {/* Recent Emails Chart */}
      <Card 
        title="Daily Email Count (Last 7 Days)"
        className="mb-6"
      >
        <div className="h-64 flex items-end justify-between">
          {getChartData().map((day, index) => {
            const height = Math.max((day.count / getChartMaxValue()) * 100, 5);
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-primary-600 rounded-t"
                  style={{ height: `${height}%` }}
                >
                  <div className="h-full w-full flex items-center justify-center text-white text-xs font-medium">
                    {day.count}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Recent Emails List */}
      <Card 
        title="Recent Emails"
        className="mb-6"
      >
        {emailStats?.recentEmails?.length > 0 ? (
          <div className="divide-y divide-dark-border">
            {emailStats.recentEmails.map((email, index) => (
              <div key={index} className="py-3">
                <h4 className="text-white font-medium">
                  {email.subject || '(No Subject)'}
                </h4>
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  <span className="truncate">{email.recipient_email}</span>
                  <span className="mx-2">•</span>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{formatDate(email.date_received)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No recent emails found</p>
        )}
      </Card>
      
      {/* Email List */}
      <Card title="All Emails">
        <Table
          columns={columns}
          data={emails}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isLoadingEmails}
          emptyMessage="No emails found"
        />
      </Card>
    </div>
  );
};

export default EmailStats; 