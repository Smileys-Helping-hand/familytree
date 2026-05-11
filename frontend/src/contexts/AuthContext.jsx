import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth token on the shared api instance
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
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
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          // If 401, try to refresh the token before giving up
          if (error?.response?.status === 401) {
            try {
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                const { data: refreshData } = await api.post('/auth/refresh', { refreshToken });
                setAuthToken(refreshData.token);
                if (refreshData.refreshToken) {
                  localStorage.setItem('refreshToken', refreshData.refreshToken);
                }
                const { data: meData } = await api.get('/auth/me');
                setUser(meData.user);
              } else {
                setAuthToken(null);
              }
            } catch {
              setAuthToken(null);
              localStorage.removeItem('refreshToken');
            }
          } else {
            console.error('Failed to load user:', error);
            setAuthToken(null);
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const resolveErrorMessage = (error, fallback) => {
    const apiError = error?.response?.data?.error ?? error?.response?.data?.message;
    if (typeof apiError === 'string') return apiError;
    if (apiError && typeof apiError === 'object') {
      if (typeof apiError.message === 'string') return apiError.message;
      if (typeof apiError.code === 'string') return `${apiError.code}: ${apiError.message || fallback}`;
      try {
        return JSON.stringify(apiError);
      } catch {
        return fallback;
      }
    }
    if (typeof error?.message === 'string') return error.message;
    return fallback;
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      setAuthToken(data.token);
      setUser(data.user);
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      const message = resolveErrorMessage(error, 'Registration failed');
      toast.error(message);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      setAuthToken(data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      setUser(data.user);
      toast.success('Welcome back!');
      return data;
    } catch (error) {
      const message = resolveErrorMessage(error, 'Login failed');
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    } finally {
      setAuthToken(null);
      localStorage.removeItem('refreshToken');
      setUser(null);
      toast.success('Logged out successfully');
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
