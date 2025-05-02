import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { KeyIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';

const TokenLogin = () => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tokenLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      toast.error('Please enter an access token');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await tokenLogin(token.trim());
      navigate('/user');
      toast.success('Login successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or inactive token');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-6">
        <KeyIcon className="h-12 w-12 text-primary-500 mx-auto" />
        <h2 className="mt-2 text-2xl font-bold text-white">User Access</h2>
        <p className="mt-1 text-sm text-gray-300">
          Enter your access token to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="token" 
            className="block text-sm font-medium text-gray-300"
          >
            Access Token
          </label>
          <input
            id="token"
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your access token"
            className="mt-1 block w-full rounded-md bg-dark-light/80 border-dark-border/50 shadow-sm text-white"
          />
          <div className="mt-1 flex justify-end">
            <a 
              href="/admin/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
            >
              Generate token
              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full btn btn-primary ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-300">
          Are you an admin?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default TokenLogin; 