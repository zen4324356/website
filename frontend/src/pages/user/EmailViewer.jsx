import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { emailApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const EmailViewer = () => {
  const { recipient } = useParams();
  const [email, setEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch email by recipient
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data } = await emailApi.searchByRecipient(recipient);
        setEmail(data.email);
      } catch (error) {
        console.error('Error fetching email:', error);
        
        if (error.response?.status === 404) {
          setError('No email found for this recipient');
        } else {
          setError('Failed to load email data');
        }
        
        toast.error(error.response?.data?.message || 'Failed to load email');
      } finally {
        setIsLoading(false);
      }
    };

    if (recipient) {
      fetchEmail();
    }
  }, [recipient]);

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Extract sender name from email
  const extractSenderName = (from) => {
    if (!from) return '';
    
    // Try to match name within quotes or before angle brackets
    const nameMatch = from.match(/"([^"]+)"/) || from.match(/^([^<]+)</);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    
    // If no name found, use the email address
    const emailMatch = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : from;
  };

  // Extract sender email address
  const extractSenderEmail = (from) => {
    if (!from) return '';
    
    const emailMatch = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : '';
  };

  // Get sender initials for avatar
  const getSenderInitials = (from) => {
    const name = extractSenderName(from);
    
    if (!name) return '?';
    
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Go back to search
  const goBack = () => {
    navigate('/user');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="flex items-center text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          
          <h1 className="text-xl font-bold text-white">
            Loading Email...
          </h1>
        </div>
        
        <div className="animate-pulse">
          <div className="h-24 bg-dark-lighter rounded-t-lg"></div>
          <div className="h-96 bg-dark-lighter rounded-b-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="flex items-center text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          
          <h1 className="text-xl font-bold text-white">
            Email Not Found
          </h1>
        </div>
        
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Email Found</h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">
              We couldn't find any emails for recipient: <span className="text-white">{recipient}</span>
            </p>
            <button 
              onClick={goBack}
              className="btn btn-primary flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Return to Search
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={goBack}
          className="flex items-center text-gray-300 hover:text-white mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </button>
        
        <h1 className="text-xl font-bold text-white">
          {email?.subject || 'No Subject'}
        </h1>
      </div>
      
      <Card className="mb-6">
        {/* Email header */}
        <div className="border-b border-dark-border pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {getSenderInitials(email?.from)}
              </div>
              
              <div className="ml-3">
                <h2 className="text-lg font-medium text-white">
                  {email?.subject || 'No Subject'}
                </h2>
                
                <div className="flex items-center text-sm text-gray-400">
                  <span className="font-medium text-gray-300">
                    {extractSenderName(email?.from)}
                  </span>
                  <span className="mx-1">&lt;{extractSenderEmail(email?.from)}&gt;</span>
                </div>
                
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <span>to {recipient}</span>
                  <span className="mx-2">•</span>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>{formatDate(email?.date_received)}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-white p-1 rounded-full"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Email body */}
        <div className="min-h-[300px]">
          {email?.body ? (
            <div 
              className="prose prose-invert max-w-none" 
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <EnvelopeIcon className="h-16 w-16 mb-4" />
              <p>This email has no content</p>
            </div>
          )}
        </div>
      </Card>
      
      <div className="text-xs text-gray-500 text-right mb-8">
        Email received: {formatDate(email?.date_received)}
      </div>
    </div>
  );
};

export default EmailViewer; 