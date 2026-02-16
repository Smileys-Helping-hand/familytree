import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Configure axios defaults
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
axios.defaults.baseURL = apiBaseUrl;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        setAuthToken(token);
        try {
          const { data } = await axios.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          setAuthToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      const { data } = await axios.post('/auth/register', userData);
      setAuthToken(data.token);
      setUser(data.user);
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await axios.post('/auth/login', credentials);
      setAuthToken(data.token);
      setUser(data.user);
      toast.success('Welcome back!');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setAuthToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
