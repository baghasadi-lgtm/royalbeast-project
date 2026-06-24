import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import { enableNotifications, disableNotifications } from '../utils/pushNotifications';

export const NotificationToggle = () => {
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const enabled = user?.notificationsEnabled !== false;

  const handleToggle = async () => {
    const next = !enabled;
    setBusy(true);
    setError(null);

    try {
      if (next) {
        await enableNotifications();
      } else {
        await disableNotifications();
      }
      await api.updateNotificationPreference(next);
      updateUser({ notificationsEnabled: next });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan preferensi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Notifikasi pesanan</p>
          <p className="text-xs text-muted mt-0.5">
            Toast, suara, dan push saat ada order atau pembayaran baru
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={handleToggle}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-ink' : 'bg-line'
          } ${busy ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
