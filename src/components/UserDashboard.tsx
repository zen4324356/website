import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, User as UserIcon, Check } from "lucide-react";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate("/user-login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gray-100 py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">User Dashboard</h1>
        <button 
          onClick={logout}
          className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-6">
            Welcome, User!
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
              <div className="flex items-center text-green-600">
                <Check className="h-5 w-5 mr-2" />
                <span>Authenticated with Access Token</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">Access Token</h3>
              <p className="font-mono text-sm text-gray-700 break-all">
                {user.accessToken}
              </p>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                This system uses Supabase for authentication and user management.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
