import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, XCircle, Clock, TrendingUp, Utensils, Banknote } from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { getSocket, joinKapsterRoom } from '../../utils/socket';
import { showQueueNotification, playNotificationSound } from '../../utils/notifications';
import { areNotificationsEnabled } from '../../utils/pushNotifications';

const PaymentBadge = ({ order }) => {
  if (order.payment_status === 'paid') {
    return <span className="badge-available">Lunas</span>;
  }
  return (
    <span className="badge-pending">
      {order.payment_method === 'cash' ? 'Tunai belum dikonfirmasi' : 'QRIS belum dikonfirmasi'}
    </span>
  );
};

export const KapsterHomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [dash, activeOrders] = await Promise.all([
        api.getKapsterDashboard(),
        api.getActiveOrders({ kapsterId: user.kapsterId }),
      ]);
      setStats(dash);
      setOrders(activeOrders);
      setToast((prev) => {
        if (!prev?.orderId) return prev;
        const stillActive = activeOrders.some((o) => o.id === prev.orderId);
        return stillActive ? prev : null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.kapsterId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!user.kapsterId) return;

    joinKapsterRoom(user.kapsterId);
    const socket = getSocket();

    const onNewOrder = async (payload) => {
      if (!areNotificationsEnabled()) {
        loadData();
        return;
      }
      setToast({
        orderId: payload.orderId,
        title: 'Pesanan Baru!',
        body: payload.queueNumber
          ? `Antrian #${payload.queueNumber} — ${payload.serviceName || 'Layanan'}`
          : `Order #${payload.orderId}`,
      });
      const notified = await showQueueNotification({
        title: '🔔 Pesanan Baru!',
        body: payload.queueNumber
          ? `Antrian #${payload.queueNumber} masuk`
          : `Order baru #${payload.orderId}`,
        tag: `new-order-${payload.orderId}`,
        sound: 'new-order',
      });
      if (!notified) await playNotificationSound('new-order');
      loadData();
    };

    const onOrderStatus = (payload) => {
      if (payload.status === 'done' || payload.status === 'cancelled') {
        setToast((prev) => (prev?.orderId === payload.orderId ? null : prev));
      }
      loadData();
    };

    socket.on('new_order', onNewOrder);
    socket.on('order_status', onOrderStatus);
    socket.on('order_payment', loadData);

    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('order_status', onOrderStatus);
      socket.off('order_payment', loadData);
    };
  }, [user.kapsterId, loadData]);

  const handleConfirmCash = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.confirmCashPayment(orderId);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOrderAction = async (orderId, status) => {
    setActionLoading(`${status}-${orderId}`);
    try {
      await api.updateOrderStatus(orderId, status);
      if (status === 'done' || status === 'cancelled') {
        setToast((prev) => (prev?.orderId === orderId ? null : prev));
      }
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui order');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="card p-4 bg-ink text-white flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Bell size={18} />
            <div>
              <p className="text-sm font-medium">{toast.title}</p>
              <p className="text-xs text-white/70">{toast.body}</p>
            </div>
          </div>
          <button onClick={() => setToast(null)} className="text-white/60 text-xs">
            Tutup
          </button>
        </div>
      )}

      {orders.length > 0 && !toast && (
        <div className="card p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
          <Bell size={18} className="text-amber-600" />
          <p className="text-sm text-amber-800">{orders.length} pesanan menunggu</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Antrian', value: stats?.queueCount, icon: Clock },
          { label: 'Selesai Hari Ini', value: stats?.servicesDoneToday, icon: CheckCircle },
          { label: 'Pendapatan', value: formatPrice(stats?.revenueToday || 0), icon: TrendingUp },
          { label: 'Uang Makan', value: formatPrice(stats?.mealAllowance || 0), icon: Utensils },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className="text-muted mb-2" strokeWidth={1.5} />
            <p className="text-xs text-muted">{label}</p>
            <p className="text-lg font-light text-ink mt-0.5 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="label-text mb-3">Antrian Aktif</h3>
        {orders.length === 0 ? (
          <div className="card p-6 text-center text-muted text-sm">Tidak ada antrian aktif</div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const isPaid = order.payment_status === 'paid';
              const needsPaymentConfirm = !isPaid;

              return (
                <div key={order.id} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">
                        {order.queue_number ? `#${order.queue_number}` : `Order #${order.id}`}
                      </p>
                      <p className="text-xs text-muted">{formatPrice(order.total_price)}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="text-[10px] uppercase text-muted">{order.payment_method}</span>
                        <PaymentBadge order={order} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderAction(order.id, 'ready')}
                        disabled={!isPaid || actionLoading}
                        className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                        title={!isPaid ? 'Konfirmasi pembayaran dulu' : 'Tampil di papan antrian beranda'}
                      >
                        Siap
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'done')}
                        disabled={!isPaid || actionLoading}
                        className="btn-primary py-2 px-3 text-xs disabled:opacity-40"
                        title={!isPaid ? 'Konfirmasi pembayaran dulu' : 'Tandai layanan selesai'}
                      >
                        Selesai
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'cancelled')}
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
                      disabled={actionLoading === order.id}
                      className="btn-primary w-full py-2 text-xs gap-1.5"
                    >
                      <Banknote size={14} />
                      {actionLoading === order.id
                        ? 'Memproses...'
                        : order.payment_method === 'cash'
                          ? 'Konfirmasi Uang Tunai Diterima'
                          : 'Konfirmasi QRIS Diterima'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
