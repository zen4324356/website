import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { verifyAdminCredentials, verifyUserToken } from '../utils/auth';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check for existing Supabase session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          type: 'admin',
          email: session.user.email || ''
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    type: 'admin' | 'user',
    credentials: { email?: string; password?: string; token?: string }
  ): Promise<boolean> => {
    if (type === 'admin' && credentials.email && credentials.password) {
      const isValid = await verifyAdminCredentials(credentials.email, credentials.password);
      return isValid;
    } else if (type === 'user' && credentials.token) {
      const { isValid, message } = await verifyUserToken(credentials.token);
      
      if (!isValid) {
        throw new Error(message);
      }
      
      const tokenUser: User = {
        type: 'user',
        token: credentials.token
      };
      setUser(tokenUser);
      return true;
    }
    
    return false;
  };

  const logout = async () => {
    if (user?.type === 'admin') {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};