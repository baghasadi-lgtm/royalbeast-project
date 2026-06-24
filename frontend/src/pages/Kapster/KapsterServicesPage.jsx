import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Send, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/format';
import { Loading } from '../../components/Loading';

const calcStaffCommission = (hargaJual) => Math.round(Number(hargaJual || 0) * 0.5);

export const KapsterServicesPage = () => {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPrice, setNewPrice] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [message, setMessage] = useState(null);

  const loadCatalog = useCallback(async () => {
    try {
      const data = await api.getKapsterServiceCatalog(user.kapsterId);
      setCatalog(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.kapsterId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleToggle = async (serviceId, enabled) => {
    setToggling(serviceId);
    setMessage(null);
    try {
      await api.toggleKapsterService(user.kapsterId, serviceId, enabled);
      setMessage({
        type: 'success',
        text: enabled ? 'Layanan diaktifkan di kiosk' : 'Layanan dinonaktifkan',
      });
      await loadCatalog();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setToggling(null);
    }
  };

  const handleSubmit = async (serviceId) => {
    const harga = parseInt(newPrice[serviceId]);
    if (!harga || harga <= 0) {
      setMessage({ type: 'error', text: 'Masukkan harga yang valid' });
      return;
    }

    const current = catalog.find((p) => p.service_id === serviceId);
    if (current?.harga_jual && harga === current.harga_jual) {
      setMessage({ type: 'error', text: 'Harga baru harus berbeda dari harga saat ini' });
      return;
    }

    setSubmitting(serviceId);
    setMessage(null);
    try {
      await api.requestPriceChange(user.kapsterId, serviceId, harga);
      setNewPrice((p) => ({ ...p, [serviceId]: '' }));
      setMessage({ type: 'success', text: 'Pengajuan berhasil dikirim ke owner' });
      await loadCatalog();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengajukan harga' });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <Loading />;

  const activeCount = catalog.filter((s) => s.is_active).length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="section-title text-xl">Layanan Saya</h3>
        <p className="text-sm text-muted mt-1">
          Pilih layanan yang ingin Anda tawarkan di kiosk ({activeCount} aktif)
        </p>
      </div>

      {message && (
        <div
          className={`card p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {catalog.map((s) => (
          <div
            key={s.service_id}
            className={`card p-5 space-y-4 transition-opacity ${!s.is_active ? 'opacity-70' : ''}`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-ink">{s.service_name}</h4>
                {s.description && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">{s.description}</p>
                )}
                {s.duration && (
                  <p className="text-xs text-muted mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {s.duration} · Standar owner {formatPrice(s.base_price)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggle(s.service_id, !s.is_active)}
                disabled={toggling === s.service_id}
                className={`shrink-0 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-full border transition-colors ${
                  s.is_active
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-muted border-line hover:border-ink/30'
                }`}
              >
                {s.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {toggling === s.service_id ? '...' : s.is_active ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            {s.is_active && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Harga Jual</p>
                    <p className="price-text mt-1">{formatPrice(s.harga_jual || s.base_price)}</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Komisi Staf (50%)</p>
                    <p className="price-text mt-1">
                      {formatPrice(calcStaffCommission(s.harga_jual || s.base_price))}
                    </p>
                  </div>
                </div>

                {s.status_pengajuan === 'pending' && (
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p>
                      Pengajuan <strong>{formatPrice(s.pending_harga_jual)}</strong> menunggu
                      approval owner.
                    </p>
                  </div>
                )}

                {s.status_pengajuan !== 'pending' && (
                  <div className="border-t border-line pt-4">
                    <p className="label-text mb-2">Ajukan Perubahan Harga</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        placeholder="Harga baru"
                        value={newPrice[s.service_id] || ''}
                        onChange={(e) =>
                          setNewPrice((prev) => ({ ...prev, [s.service_id]: e.target.value }))
                        }
                        className="input-field flex-1 py-2.5"
                      />
                      <button
                        onClick={() => handleSubmit(s.service_id)}
                        disabled={submitting === s.service_id}
                        className="btn-primary py-2.5 px-4 text-xs gap-1.5 shrink-0"
                      >
                        <Send size={14} />
                        {submitting === s.service_id ? '...' : 'Ajukan'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
