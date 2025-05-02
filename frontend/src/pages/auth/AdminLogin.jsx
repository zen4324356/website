import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { UserIcon } from '@heroicons/react/24/solid';

const AdminLogin = () => {
  const { adminLogin, isAdmin, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: 'admin@example.com', // Default email for easy testing
    password: 'admin123', // Default password for easy testing
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // If already logged in as admin, redirect to admin dashboard
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await adminLogin(formData.email, formData.password);
      toast.success('Login successful');
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.message || authError || 'Login failed');
      toast.error(err?.response?.data?.message || authError || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="text-center mb-6">
        <UserIcon className="h-12 w-12 text-primary-500 mx-auto" />
        <h2 className="mt-2 text-2xl font-bold text-white">Admin Login</h2>
        <p className="mt-1 text-sm text-gray-300">
          Sign in to access the dashboard
        </p>
      </div>
      
      {error && (
        <div className="bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
            className="mt-1 block w-full rounded-md bg-dark-light/80 border-dark-border/50 shadow-sm text-white"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="mt-1 block w-full rounded-md bg-dark-light/80 border-dark-border/50 shadow-sm text-white"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn btn-primary ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-300">
          Are you a user?{' '}
          <Link to="/token-login" className="text-primary-400 hover:text-primary-300">
            Login with access token
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin; 