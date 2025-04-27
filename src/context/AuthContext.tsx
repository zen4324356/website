import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User, Admin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
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
  }, []);

  // User login
  const login = async (accessToken: string): Promise<boolean> => {
    try {
      // Validate token with Supabase
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
      
      if (!data || !data.data) {
        console.error("No token data found:", data);
        toast({
          title: "Login Error",
          description: "No access tokens found",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if token exists and is not blocked
      const foundToken = data.data.find((token: any) => token.token === accessToken);
      
      if (!foundToken) {
        console.error("Token not found:", accessToken);
        toast({
          title: "Invalid Token",
          description: "The access token does not exist.",
          variant: "destructive"
        });
        return false;
      }
      
      if (foundToken.blocked) {
        console.error("Token is blocked:", foundToken);
        toast({
          title: "Blocked Token",
          description: "This access token has been blocked by an administrator.",
          variant: "destructive"
        });
        return false;
      }
      
      // Token is valid, create user object
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
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Admin login
  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("Admin login attempt with:", { username });
      
      if (!username || !password) {
        console.error("Username and password are required");
        toast({
          title: "Login Failed",
          description: "Username and password are required",
          variant: "destructive"
        });
        return false;
      }
      
      // Try to get admin credentials from the database
      const { data: adminData, error: adminError } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();
      
      if (adminError || !adminData) {
        console.error("Error fetching admin credentials:", adminError);
        
        // Check if we should use default credentials (for first-time setup)
        const { count, error: countError } = await supabase
          .from('admin_credentials')
          .select('*', { count: 'exact', head: true });
        
        if ((countError || count === 0) && username === "Admin@Akshay" && password === "Admin@Akshay") {
          // No admin credentials in database, use default
          console.log("No admin credentials in database, using defaults");
          
          // Insert default admin credentials
          const { error: insertError } = await supabase
            .from('admin_credentials')
            .insert({
              username: "Admin@Akshay",
              password: "Admin@Akshay",
              is_active: true
            });
          
          if (insertError) {
            console.error("Error creating admin credentials:", insertError);
            toast({
              title: "Login Failed",
              description: "Failed to create admin account",
              variant: "destructive"
            });
            return false;
          }
          
          // Set admin state
          const adminCredentials = { username: "Admin@Akshay", password: "Admin@Akshay" };
          setAdmin(adminCredentials);
          setIsAuthenticated(true);
          setIsAdmin(true);
          
          toast({
            title: "Login Successful",
            description: "You have successfully logged in as an administrator using default credentials.",
          });
          
          return true;
        }
        
        toast({
          title: "Login Failed",
          description: "Invalid admin username or password.",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if password matches
      if (adminData.password === password) {
        console.log("Admin credentials matched");
        
        // Set admin state
        const adminCredentials = { 
          username: adminData.username,
          password: adminData.password
        };
        
        setAdmin(adminCredentials);
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        toast({
          title: "Login Successful",
          description: "You have successfully logged in as an administrator.",
        });
        
        return true;
      }
      
      // Password doesn't match
      console.error("Invalid admin password");
      toast({
        title: "Login Failed",
        description: "Invalid admin username or password.",
        variant: "destructive"
      });
      return false;
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Logout
  const logout = () => {
    // Clear stored data
    if (isAdmin) {
      // Don't need to do anything with admin credentials in the database
      setAdmin(null);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
    
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      user,
      admin,
      login,
      adminLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
