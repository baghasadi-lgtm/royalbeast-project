import React, { useState } from 'react';
import { api } from '../api/api';

export const ChangePasswordForm = ({ compact = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword.length < 6) {
      setMessage('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'card p-5 space-y-3'}>
      {!compact && <h3 className="font-medium text-sm text-ink">Ubah Password</h3>}
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Password lama"
        className="input-field"
        required
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Password baru (min. 6 karakter)"
        className="input-field"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Ulangi password baru"
        className="input-field"
        required
      />
      {message && (
        <p className={`text-xs ${message.includes('berhasil') ? 'text-emerald-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-secondary w-full text-xs">
        {loading ? 'Menyimpan...' : 'Simpan Password'}
      </button>
    </form>
  );
};
