import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set default axios base URL and authorization header
  axios.defaults.baseURL = ''; // handled by Vite proxy
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/auth/profile');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          // Token invalid
          logout();
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        // On server failure, don't force logout immediately, but if 401 is returned, logout
        if (err.response && err.response.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      if (res.data.success) {
        const userToken = res.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const userToken = res.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Profile update failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
