import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('transport_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('transport_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('transport_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            localStorage.setItem('transport_user', JSON.stringify(res.data.user));
            if (res.data.profile) {
              localStorage.setItem('transport_profile', JSON.stringify(res.data.profile));
            }
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('transport_token', res.data.token);
      localStorage.setItem('transport_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      if (res.data.profile) {
        localStorage.setItem('transport_profile', JSON.stringify(res.data.profile));
        setProfile(res.data.profile);
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      localStorage.setItem('transport_token', res.data.token);
      localStorage.setItem('transport_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      if (res.data.profile) {
        localStorage.setItem('transport_profile', JSON.stringify(res.data.profile));
        setProfile(res.data.profile);
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('transport_token');
    localStorage.removeItem('transport_user');
    localStorage.removeItem('transport_profile');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        localStorage.setItem('transport_user', JSON.stringify(res.data.user));
        if (res.data.profile) {
          localStorage.setItem('transport_profile', JSON.stringify(res.data.profile));
        }
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'TRANSPORT_MANAGER',
    isStudent: user?.role === 'STUDENT',
    isDriver: user?.role === 'DRIVER'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
