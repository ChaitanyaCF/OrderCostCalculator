import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';

// Define a more complete User interface that represents both possible formats
interface AuthContextUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthContextUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to normalize admin status
const normalizeAdminStatus = (user: any): AuthContextUser => {
  // Console log to help debug
  console.log('Normalizing user:', user);
  
  // First check if admin property exists and is boolean
  let isAdminValue = false;
  if (user && typeof user.admin === 'boolean') {
    isAdminValue = user.admin;
  } else if (user && typeof user.isAdmin === 'boolean') {
    isAdminValue = user.isAdmin;
  } else if (user && user.admin) {
    // Try to convert to boolean if it's not already
    isAdminValue = Boolean(user.admin);
  }
    
  console.log('Admin status determination:', { 
    rawUser: JSON.stringify(user),
    admin: user?.admin, 
    isAdmin: user?.isAdmin, 
    finalValue: isAdminValue 
  });
  
  return {
    id: user.id,
    username: user.username,
    isAdmin: isAdminValue
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCurrentUser = async () => {
      setLoading(true);
      try {
        const currentUser = AuthService.getCurrentUser();
        console.log('Current user from localStorage:', currentUser);
        
        if (currentUser) {
          setUser(normalizeAdminStatus(currentUser));
        }
      } catch (err) {
        console.error("Error checking current user:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AuthService.login(username, password);
      console.log('Login response data:', data);
      
      const normalizedUser = normalizeAdminStatus(data);
      console.log('Normalized user after login:', normalizedUser);
      setUser(normalizedUser);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, email?: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.register(username, password, email);
      // After successful registration, log in with the new credentials
      await login(username, password);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};