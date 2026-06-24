import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scissors, User } from 'lucide-react';

const links = [
  { to: '/staff-dashboard', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/staff-dashboard/layanan', label: 'Layanan Saya', icon: Scissors },
  { to: '/staff-dashboard/profil', label: 'Profil', icon: User },
];

export const KapsterNav = () => (
  <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
    {links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          `shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
            isActive ? 'bg-ink text-white' : 'bg-white border border-line text-muted hover:text-ink'
          }`
        }
      >
        <Icon size={14} strokeWidth={1.5} />
        {label}
      </NavLink>
    ))}
  </nav>
);
