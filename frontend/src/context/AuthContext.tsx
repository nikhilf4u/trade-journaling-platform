import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

  // On app load, restore token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('tradeToken');
    const storedUser = localStorage.getItem('tradeUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });

    console.log('🔑 Login response:', response.data);

    // ⭐ Unwrap the ApiResponse envelope (from common-library)
    // Backend returns: { success, message, data: { token, userId, ... }, error }
    const payload = response.data.data || response.data;

    console.log('📦 Unwrapped payload:', payload);

    const {
      token: jwtToken,
      userId,
      email: userEmail,
      baseCurrency,
      totalCapital,
    } = payload;

    if (!jwtToken) {
      throw new Error('No token received from server');
    }

    const userData: User = {
      id: userId,
      email: userEmail,
      baseCurrency,
      totalCapital,
    };

    // Save to localStorage
    localStorage.setItem('tradeToken', jwtToken);
    localStorage.setItem('tradeUser', JSON.stringify(userData));

    // Set axios default header (so all future requests include the JWT)
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

    // Update React state
    setToken(jwtToken);
    setUser(userData);

    console.log('✅ Token stored:', jwtToken.substring(0, 30) + '...');

    return jwtToken;
  };

  const register = async (data: any): Promise<void> => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, data);
    // Unwrap if needed (for future use)
    return response.data.data || response.data;
  };

  const logout = () => {
    localStorage.removeItem('tradeToken');
    localStorage.removeItem('tradeUser');
    delete axios.defaults.headers.common['Authorization'];
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