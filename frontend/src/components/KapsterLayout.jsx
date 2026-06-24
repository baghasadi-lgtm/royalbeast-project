import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KapsterNav } from './KapsterNav';

export const KapsterLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Staff Kapster</p>
          <h2 className="section-title">Halo, {user?.username}</h2>
        </div>
        <button onClick={handleLogout} className="btn-ghost gap-1.5 text-xs shrink-0">
          <LogOut size={16} />
          Keluar
        </button>
      </div>

      <KapsterNav />
      <Outlet />
    </div>
  );
};
