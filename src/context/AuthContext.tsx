import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Define our types
export interface User {
  id: string;
  accessToken: string;
  isBlocked: boolean;
}

export interface Admin {
  id: string;
  username: string;
}

export interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (accessToken: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("adminCredentials");
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(false);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
      }
    }
    
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
        // Don't automatically log in admin for security
      } catch (err) {
        console.error("Error parsing stored admin:", err);
        localStorage.removeItem("adminCredentials");
      }
    }
  }, []);

  // User login with access token
  const login = async (accessToken: string): Promise<boolean> => {
    try {
      // Validate token with Supabase function
      const { data, error } = await supabase.functions.invoke('fetch-access-tokens');
      
      if (error) {
        console.error("Error fetching tokens:", error);
        toast({
          title: "Login Error",
          description: error.message || "Failed to fetch tokens",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if token exists and is not blocked
      const foundToken = data.data.find((token: any) => token.token === accessToken);
      
      if (!foundToken) {
        toast({
          title: "Invalid Token",
          description: "The access token does not exist.",
          variant: "destructive"
        });
        return false;
      }
      
      if (foundToken.blocked) {
        toast({
          title: "Blocked Token",
          description: "This access token has been blocked by an administrator.",
          variant: "destructive"
        });
        return false;
      }
      
      // Valid token, create user object
      const userData: User = {
        id: foundToken.id,
        accessToken: foundToken.token,
        isBlocked: foundToken.blocked
      };
      
      // Store user data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      toast({
        title: "Login Successful",
        description: "You have successfully logged in as a user.",
      });
      
      return true;
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Admin login with username and password
  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      // Validate admin credentials with Supabase function
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { username, password }
      });
      
      if (error) {
        console.error("Admin login error:", error);
        toast({
          title: "Login Error",
          description: error.message || "Failed to authenticate",
          variant: "destructive"
        });
        return false;
      }
      
      if (!data.success) {
        toast({
          title: "Invalid Credentials",
          description: "The username or password is incorrect.",
          variant: "destructive"
        });
        return false;
      }
      
      // Valid credentials, create admin object
      const adminData: Admin = {
        id: data.admin.id,
        username: data.admin.username
      };
      
      // Store admin data
      localStorage.setItem("adminCredentials", JSON.stringify(adminData));
      setAdmin(adminData);
      setIsAuthenticated(true);
      setIsAdmin(true);
      
      toast({
        title: "Login Successful",
        description: "You have successfully logged in as an administrator.",
      });
      
      return true;
    } catch (err) {
      console.error("Admin login error:", err);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminCredentials");
    setUser(null);
    setAdmin(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAuthenticated,
        isAdmin,
        login,
        adminLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
