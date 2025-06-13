
/* eslint-disable @typescript-eslint/no-explicit-any */
// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getUserProfile, updateUserProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types/user'; // Import shared User type

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showLoginAnimation: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  setShowLoginAnimation: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getUserProfile();
          setUser(userData);
        } catch (error) {
          console.error('Auth token invalid', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.token);
      setUser(data);
      
      // Show the login animation
      setShowLoginAnimation(true);
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.username}!`,
      });
      
      // Navigate after animation completes
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error: any) {
      console.error('Login failed', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, fullName: string, email: string, password: string, referralCode?: string) => {
    try {
      setIsLoading(true);
      console.log('Registering user with data:', { username, fullName, email, referralCode });
      const data = await registerUser(username, fullName, email, password, referralCode);
      console.log('Registration successful, data received:', data);

      localStorage.setItem('token', data.token);
      setUser(data);
      
      // Show the login animation for registration too
      setShowLoginAnimation(true);
      
      toast({
        title: 'Registration successful',
        description: `Welcome, ${data.anonymousAlias}! Your anonymous identity has been created.`,
      });
      if (referralCode) {
        toast({
          title: 'Referral Applied',
          description: 'The referral code has been successfully applied.',
        });
      }
      
      // Navigate after animation completes
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error: any) {
      console.error('Registration failed', error);

      let errorMessage = 'Registration failed';
      if (error.response) {
        errorMessage = error.response.data?.message || 'Server error: ' + error.response.status;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      const updatedUser = await updateUserProfile(userData);
      setUser(prev => (prev ? { ...prev, ...updatedUser } : null));
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      return;
    } catch (error: any) {
      console.error('Update profile failed', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update profile',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        showLoginAnimation,
        login,
        register,
        logout,
        updateProfile,
        setShowLoginAnimation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
