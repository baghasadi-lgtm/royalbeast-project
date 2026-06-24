import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const AuthContext = createContext(null);

const STAFF_ROLES = ['staff', 'kapster'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rb_token');
    const saved = localStorage.getItem('rb_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      api.setToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('rb_token', data.token);
    localStorage.setItem('rb_user', JSON.stringify(data.user));
    api.setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');
    api.setToken(null);
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('rb_user', JSON.stringify(next));
      return next;
    });
  };

  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isOwner: user?.role === 'owner',
        isStaff,
        isKapster: isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
