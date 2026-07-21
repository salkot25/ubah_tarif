import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';
import { useToast } from '../components/ui/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Restore session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('AUTH_TOKEN');
      const storedUser = localStorage.getItem('AUTH_USER');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Gagal mengembalikan sesi login:', err);
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to global unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      toast.error('Sesi Anda telah berakhir, silakan login kembali.');
    };
    window.addEventListener('gas-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('gas-unauthorized', handleUnauthorized);
  }, [toast]);

  const login = async (username, password) => {
    try {
      const res = await apiLogin(username, password);
      if (res.status === 'success') {
        localStorage.setItem('AUTH_TOKEN', res.token);
        localStorage.setItem('AUTH_USER', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        toast.success(`Selamat datang kembali, ${res.user.nama || username}!`);
        return { success: true };
      } else {
        return { success: false, message: res.message || 'Login gagal' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Koneksi ke server gagal' };
    }
  };

  const logout = () => {
    localStorage.removeItem('AUTH_TOKEN');
    localStorage.removeItem('AUTH_USER');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
