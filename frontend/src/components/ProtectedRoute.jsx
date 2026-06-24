import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './Loading';

const STAFF_ROLES = ['staff', 'kapster'];

export const ProtectedRoute = ({ children, role, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const allowed = roles || (role === 'staff' ? STAFF_ROLES : role ? [role] : null);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
