import { useState, useEffect } from 'react';
import { tokenApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import {
  KeyIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  PlusIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const TokenManagement = () => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Fetch tokens
  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const { data } = await tokenApi.getAllTokens();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  // Load tokens on mount
  useEffect(() => {
    fetchTokens();
  }, []);

  // Validate token format
  const validateToken = (token) => {
    if (!token) return true; // Empty is valid (will auto-generate)
    
    // Token should be alphanumeric, dashes, and underscores, at least 10 chars
    const validTokenPattern = /^[A-Za-z0-9_-]{10,}$/;
    return validTokenPattern.test(token);
  };

  // Handle token input change
  const handleTokenChange = (e) => {
    const token = e.target.value;
    setCustomToken(token);
    
    if (token && !validateToken(token)) {
      setTokenError('Token must be at least 10 characters and contain only letters, numbers, underscores, and dashes');
    } else {
      setTokenError('');
    }
  };

  // Create token
  const createToken = async (e) => {
    e.preventDefault();
    
    // Validate custom token if provided
    if (customToken && !validateToken(customToken)) {
      setTokenError('Token must be at least 10 characters and contain only letters, numbers, underscores, and dashes');
      return;
    }
    
    try {
      setIsCreating(true);
      
      const tokenData = customToken.trim() 
        ? { token: customToken.trim() } 
        : {};
      
      console.log('Creating token with data:', tokenData);
      const { data } = await tokenApi.createToken(tokenData);
      
      // Add new token to state
      setTokens(prev => [data.token, ...prev]);
      
      toast.success('Token created successfully');
      setCustomToken('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error(error.response?.data?.message || 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Copy token to clipboard
  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
      .then(() => toast.success('Token copied to clipboard!'))
      .catch(() => toast.error('Failed to copy token'));
  };

  // Toggle token status
  const toggleTokenStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    try {
      const { data } = await tokenApi.updateTokenStatus(id, newStatus);
      
      // Update token in state
      setTokens(prev => 
        prev.map(token => 
          token.id === id ? { ...token, status: newStatus } : token
        )
      );
      
      toast.success(`Token ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`);
    } catch (error) {
      console.error('Error updating token status:', error);
      toast.error('Failed to update token status');
    }
  };

  // Delete token
  const deleteToken = async (id) => {
    if (!confirm('Are you sure you want to delete this token?')) return;
    
    try {
      await tokenApi.deleteToken(id);
      
      // Remove token from state
      setTokens(prev => prev.filter(token => token.id !== id));
      
      toast.success('Token deleted successfully');
    } catch (error) {
      console.error('Error deleting token:', error);
      toast.error('Failed to delete token');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Table columns
  const columns = [
    { 
      header: 'Token', 
      accessor: 'token',
      render: (row) => (
        <div className="flex items-center">
          <KeyIcon className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0" />
          <span className="font-mono text-xs">{row.token}</span>
          <button 
            onClick={() => copyToken(row.token)}
            className="ml-2 p-1 text-gray-400 hover:text-primary-400"
            title="Copy token"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <div className={`flex items-center ${
          row.status === 'active' ? 'text-green-500' : 'text-red-500'
        }`}>
          {row.status === 'active' ? (
            <ShieldCheckIcon className="h-4 w-4 mr-1" />
          ) : (
            <ShieldExclamationIcon className="h-4 w-4 mr-1" />
          )}
          <span className="capitalize">{row.status}</span>
        </div>
      )
    },
    { 
      header: 'Created At', 
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at)
    },
    { 
      header: 'Last Login', 
      accessor: 'last_login_at',
      render: (row) => formatDate(row.last_login_at)
    },
    { 
      header: 'Actions', 
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleTokenStatus(row.id, row.status)}
            className={`p-1 rounded hover:bg-dark-light ${
              row.status === 'active' ? 'text-red-500' : 'text-green-500'
            }`}
            title={row.status === 'active' ? 'Block Token' : 'Activate Token'}
          >
            {row.status === 'active' ? (
              <ShieldExclamationIcon className="h-5 w-5" />
            ) : (
              <ShieldCheckIcon className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={() => deleteToken(row.id)}
            className="p-1 rounded text-red-500 hover:bg-dark-light"
            title="Delete Token"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Access Tokens</h1>
        
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setCustomToken('');
            setTokenError('');
          }}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          {showCreateForm ? 'Cancel' : 'Create Token'}
        </button>
      </div>
      
      {/* Create token form */}
      {showCreateForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-medium text-white mb-4">Create New Access Token</h2>
          
          <form onSubmit={createToken}>
            <div className="mb-4">
              <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">
                Custom Token
              </label>
              <input
                id="token"
                type="text"
                value={customToken}
                onChange={handleTokenChange}
                className={`w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white ${
                  tokenError ? 'border-red-500' : ''
                }`}
                placeholder="Enter custom token or leave blank to generate automatically"
              />
              {tokenError ? (
                <p className="mt-1 text-xs text-red-500">{tokenError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  If not provided, a random token will be generated. Custom tokens must be at least 10 characters.
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCustomToken('');
                  setTokenError('');
                }}
                className="btn mr-2 bg-dark-light text-gray-300 hover:bg-dark-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || (customToken && tokenError)}
                className={`btn btn-primary ${
                  isCreating || (customToken && tokenError) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isCreating ? 'Creating...' : 'Create Token'}
              </button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Tokens table */}
      <Table
        columns={columns}
        data={tokens}
        isLoading={isLoading}
        emptyMessage="No access tokens found"
      />
    </div>
  );
};

export default TokenManagement; 