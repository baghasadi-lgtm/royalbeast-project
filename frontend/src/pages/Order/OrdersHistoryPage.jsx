import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { formatPrice } from '../../utils/format';
import { Loading } from '../../components/Loading';

const statusBadge = (status) => {
  if (status === 'done') return 'badge-available';
  if (status === 'cancelled') return 'badge-unavailable';
  if (status === 'ready') return 'badge-pending';
  return 'badge-pending';
};

const statusLabel = (status) => {
  if (status === 'done') return 'Selesai';
  if (status === 'cancelled') return 'Batal';
  if (status === 'ready') return 'Dipanggil';
  if (status === 'pending') return 'Menunggu';
  return status;
};

export const OrdersHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [kapsterId, setKapsterId] = useState('');
  const [kapsters, setKapsters] = useState([]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrderHistory({ date, kapsterId });
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDate('');
    setKapsterId('');
    setLoading(true);
    api.getOrderHistory({ date: '', kapsterId: '' })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getKapsters().then(setKapsters);
    loadOrders();
  }, []);

  return (
    <div className="page-container max-w-5xl space-y-4 sm:space-y-6">
      <div>
        <button onClick={() => navigate('/admin/orders')} className="btn-ghost mb-3 sm:mb-4 -ml-2">
          ← Kembali
        </button>
        <h2 className="section-title text-xl sm:text-2xl">Riwayat Order</h2>
      </div>

      <div className="filter-card">
        <div className="filter-bar">
          <div className="filter-field">
            <label className="label-text">Tanggal</label>
            <div className="date-input-wrap">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field py-2.5"
              />
            </div>
          </div>
          <div className="filter-field">
            <label className="label-text">Kapster</label>
            <select
              value={kapsterId}
              onChange={(e) => setKapsterId(e.target.value)}
              className="input-field py-2.5"
            >
              <option value="">Semua</option>
              {kapsters.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 min-w-0">
            <button onClick={loadOrders} className="btn-primary py-2.5 text-xs sm:text-sm w-full">
              Filter
            </button>
            <button onClick={handleReset} className="btn-secondary py-2.5 text-xs sm:text-sm w-full">
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">Tidak ada riwayat</div>
      ) : (
        <div className="card overflow-hidden">
          <p className="px-4 py-2 text-[10px] text-muted border-b border-line sm:hidden">
            Geser tabel ke kiri/kanan →
          </p>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">Antrian</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">Kapster</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {order.queue_number ? `#${order.queue_number}` : '-'}
                    </td>
                    <td className="px-4 py-3 price-text whitespace-nowrap">{formatPrice(order.total_price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={statusBadge(order.status)}>{statusLabel(order.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{order.kapster_name || '-'}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
