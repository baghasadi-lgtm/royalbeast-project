import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api/api';
import { qrisImageUrl } from '../utils/format';

export const QrisSettings = () => {
  const [qrisImage, setQrisImage] = useState('/qris.jpg');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.getQrisSetting();
      setQrisImage(data.qrisImage || '/qris.jpg');
    } catch (err) {
      setError(err.message || 'Gagal memuat QRIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    if (!file) {
      setError('Pilih gambar QRIS dulu');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('qris', file);
      const data = await api.updateQrisSetting(formData);
      setQrisImage(data.qrisImage);
      setFile(null);
      setPreview(null);
      setMessage('Gambar QRIS berhasil diperbarui');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan QRIS');
    } finally {
      setSaving(false);
    }
  };

  const displaySrc = preview || qrisImageUrl(qrisImage);

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-ink">QRIS Pembayaran</h3>
        <p className="text-xs text-muted mt-0.5">
          Gambar ini ditampilkan ke customer saat memilih bayar QRIS
        </p>
      </div>

      <div className="flex justify-center p-4 bg-surface border border-line rounded-xl">
        {loading ? (
          <div className="w-48 h-48 flex items-center justify-center text-xs text-muted">Memuat...</div>
        ) : (
          <img src={displaySrc} alt="QRIS" className="w-48 h-48 object-contain rounded-lg" />
        )}
      </div>

      <label className="cursor-pointer btn-secondary text-xs gap-2 inline-flex w-full justify-center">
        <Upload size={16} />
        Pilih Gambar Baru
        <input type="file" accept="image/*" hidden onChange={handleFile} />
      </label>

      {file && (
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-xs">
          {saving ? 'Menyimpan...' : 'Simpan QRIS'}
        </button>
      )}

      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
