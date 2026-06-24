import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { unlockNotificationAudio } from '../../utils/notifications';
import { clearKioskSession } from '../../utils/kioskSession';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { clearCart } = useCart();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      clearKioskSession();
      clearCart();
      await unlockNotificationAudio();
      if (user.role === 'owner') navigate('/admin');
      else navigate('/staff-dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-tight text-ink">Staff Login</h1>
          <p className="text-sm text-muted mt-2">Masuk sebagai owner atau staf</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="label-text">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="owner / staf"
              required
            />
          </div>

          <div>
            <label className="label-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Demo: owner/owner123 · staf/staf123
        </p>

        <button onClick={() => navigate('/')} className="btn-ghost w-full text-center">
          Kembali ke Kiosk
        </button>
      </div>
    </div>
  );
};
