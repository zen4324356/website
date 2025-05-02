import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Handle email search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a recipient email to search');
      return;
    }

    try {
      setIsSearching(true);
      
      // Redirect to email viewer with the search query
      navigate(`/user/email/${encodeURIComponent(searchQuery.trim())}`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Email Search</h1>
        
        <Card 
          title="Search for Emails"
          icon={EnvelopeIcon}
          className="mb-6"
        >
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-grow">
                <label htmlFor="email-search" className="block text-sm font-medium text-gray-300 mb-1">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <input
                    id="email-search"
                    type="email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter recipient email address"
                    className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white pl-10"
                    autoComplete="off"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Only the latest email for each recipient is stored
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className={`btn btn-primary md:w-auto ${
                  isSearching || !searchQuery.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSearching ? 'Searching...' : 'Search Emails'}
              </button>
            </div>
          </form>
        </Card>
        
        <Card 
          title="Usage Instructions"
          className="mb-6"
        >
          <div className="space-y-3 text-gray-300">
            <p>
              Enter the <strong>exact recipient email address</strong> you want to search for.
              Only the latest email for each recipient is stored in the system.
            </p>
            <p>
              The email viewer will display the most recent email sent to that address,
              formatted in a Gmail-like layout for easy reading.
            </p>
          </div>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            This tool only shows the most recent email for each recipient.
            If you can't find an email, please check that you've entered the correct address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 