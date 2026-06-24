import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Beranda' },
    { path: '/services', label: 'Layanan' },
    { path: '/products', label: 'Produk' },
    { path: '/cart', label: 'Keranjang' }
  ];

  // Hide navigation on kapster-related pages
  if (location.pathname.startsWith('/kapster')) {
    return null;
  }

  return (
    <nav className="bg-white border-b sticky top-16 z-10">
      <div className="max-w-4xl mx-auto px-4 flex gap-1">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`px-4 py-3 font-medium ${
              location.pathname === item.path
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};