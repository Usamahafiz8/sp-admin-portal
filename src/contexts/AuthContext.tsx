'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/auth/super-admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, it's likely an HTML error page
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check if the backend server is running on the correct port.');
        }
        throw new Error(`Server error (${response.status}). Please check if the backend API is running.`);
      }

      const data = await response.json();

      // Check if response is successful (201 is valid for POST)
      if (!response.ok && response.status !== 201) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle response structure: { success: true, data: { user: {...}, token: "..." } }
      let userData, authToken;
      
      if (data.data && data.data.user && data.data.token) {
        // Standard response structure
        userData = data.data.user;
        authToken = data.data.token;
      } else if (data.user && data.token) {
        // Alternative structure
        userData = data.user;
        authToken = data.token;
      } else if (data.data) {
        // Direct data structure
        userData = data.data.user || data.data;
        authToken = data.data.token || data.data.accessToken || data.token;
      } else {
        throw new Error('Invalid response format from server');
      }

      // Since this is the super-admin/login endpoint, if it succeeds, user is a super admin
      // The role is encoded in the JWT token, but not in the user object
      // Add role to userData for consistency
      if (!userData.role) {
        userData.role = 'super_admin';
      }

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to the server. Please ensure the backend API is running on http://localhost:3000');
      }
      
      // Re-throw with better message if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Login failed. Please try again.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

