import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, Banknote } from 'lucide-react';
import { api } from '../../api/api';
import { formatPrice } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { useNewOrderAlerts } from '../../hooks/useNewOrderAlerts';

const PaymentBadge = ({ order }) => {
  if (order.payment_status === 'paid') {
    return <span className="badge-available">Lunas</span>;
  }
  return <span className="badge-pending">{order.payment_method === 'cash' ? 'Tunai' : 'QRIS'} pending</span>;
};

export const ManageOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getActiveOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { toast, dismissToast } = useNewOrderAlerts(loadOrders);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleAction = async (orderId, status) => {
    setActionLoading(`${status}-${orderId}`);
    try {
      await api.updateOrderStatus(orderId, status);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCash = async (orderId) => {
    setActionLoading(`cash-${orderId}`);
    try {
      await api.confirmCashPayment(orderId);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Kelola Order</h2>
          <p className="text-sm text-muted mt-1">Antrian dan pesanan aktif</p>
        </div>
        <button onClick={() => navigate('/admin/orders/history')} className="btn-secondary py-2 text-xs gap-1.5">
          <Clock size={14} />
          Riwayat
        </button>
      </div>

      {toast && (
        <div className="card p-4 bg-ink text-white flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Bell size={18} />
            <div>
              <p className="text-sm font-medium">{toast.title}</p>
              <p className="text-xs text-white/70">{toast.body}</p>
            </div>
          </div>
          <button onClick={dismissToast} className="text-white/60 text-xs">
            Tutup
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">Tidak ada order aktif</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isPaid = order.payment_status === 'paid';
            const needsPaymentConfirm = !isPaid;

            return (
              <div key={order.id} className="card p-5 space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="font-medium text-ink">
                      {order.queue_number ? `Antrian #${order.queue_number}` : `Order #${order.id}`}
                    </p>
                    <p className="text-sm text-muted">{order.kapster_name || 'Tanpa kapster'}</p>
                    <p className="price-text text-sm mt-1">{formatPrice(order.total_price)}</p>
                    <div className="mt-1 flex gap-2 items-center">
                      <span className="text-[10px] uppercase text-muted">{order.payment_method}</span>
                      <PaymentBadge order={order} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(order.id, 'done')}
                      disabled={!isPaid || actionLoading}
                      className="btn-primary py-2 px-4 text-xs gap-1 disabled:opacity-40"
                    >
                      <CheckCircle size={14} />
                      Selesai
                    </button>
                    <button
                      onClick={() => handleAction(order.id, 'cancelled')}
                      disabled={actionLoading}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>

                {needsPaymentConfirm && (
                  <button
                    onClick={() => handleConfirmCash(order.id)}
                    disabled={actionLoading === `cash-${order.id}`}
                    className="btn-secondary w-full py-2 text-xs gap-1.5"
                  >
                    <Banknote size={14} />
                    {order.payment_method === 'cash' ? 'Konfirmasi Tunai Diterima' : 'Konfirmasi QRIS Diterima'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
