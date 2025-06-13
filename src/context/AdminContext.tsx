
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    console.log('Admin login attempt:', { email, password });
    if (email === 'admin@gmail.com' && password === 'admin123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      console.log('Admin login successful');
      return true;
    }
    console.log('Admin login failed');
    return false;
  };

  const logout = () => {
    console.log('Admin logout');
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  return (
    <AdminContext.Provider value={{ isAdminAuthenticated, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
