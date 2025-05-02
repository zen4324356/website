import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  const { isAdmin, isUser } = useAuth();
  
  // Determine where to redirect the user
  const getRedirectPath = () => {
    if (isAdmin) return '/admin';
    if (isUser) return '/user';
    return '/login';
  };

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-dark">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ExclamationTriangleIcon className="h-20 w-20 text-yellow-500 mx-auto" />
          <h1 className="mt-6 text-5xl font-extrabold text-white">404</h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-300">Page Not Found</h2>
          <p className="mt-2 text-base text-gray-400">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="mt-8">
          <Link
            to={getRedirectPath()}
            className="btn btn-primary w-full"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 