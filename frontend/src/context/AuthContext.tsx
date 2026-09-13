import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/apiClient';

interface User {
  id: number;
  email: string;
  baseCurrency: string;
  totalCapital: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('tradeToken');
    const storedUser = localStorage.getItem('tradeUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const response = await apiClient.post('/auth/login', { email, password });
    const payload = response.data.data || response.data;
    const { token: jwtToken, userId, email: userEmail, baseCurrency, totalCapital } = payload;

    if (!jwtToken) throw new Error('No token received from server');

    const userData: User = { id: userId, email: userEmail, baseCurrency, totalCapital };

    localStorage.setItem('tradeToken', jwtToken);
    localStorage.setItem('tradeUser', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);

    return jwtToken;
  };

  const register = async (data: any): Promise<void> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data || response.data;
  };

  const logout = () => {
    localStorage.removeItem('tradeToken');
    localStorage.removeItem('tradeUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};