import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { clearKioskSession } from '../utils/kioskSession';

export const Header = () => {
  const { cart, clearCart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isKiosk = !user &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/staff-dashboard') &&
    !location.pathname.startsWith('/kapster-dashboard') &&
    !location.pathname.startsWith('/login');

  const handleLogout = () => {
    clearKioskSession();
    clearCart();
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-line">
      <div className="max-w-3xl mx-auto px-5 h-16 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="text-lg font-medium tracking-tight text-ink hover:opacity-70 transition-opacity"
        >
          Royal Beast
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === 'owner' && (
                <button onClick={() => navigate('/admin')} className="btn-ghost text-xs">
                  Admin
                </button>
              )}
              {(user.role === 'staff' || user.role === 'kapster') && (
                <button onClick={() => navigate('/staff-dashboard')} className="btn-ghost text-xs">
                  Staf
                </button>
              )}
              <button onClick={handleLogout} className="btn-ghost p-2" title="Keluar">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-ghost text-xs gap-1.5">
              <User size={16} />
              <span className="hidden sm:inline">Staff</span>
            </button>
          )}

          {isKiosk && (
            <button onClick={() => navigate('/cart')} className="relative p-2 rounded-lg hover:bg-surface transition-colors">
              <ShoppingBag size={20} className="text-ink" strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ink text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
