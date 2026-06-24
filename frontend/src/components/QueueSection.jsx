import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Users, Megaphone } from 'lucide-react';
import { api } from '../api/api';
import { getSocket, joinQueueRoom } from '../utils/socket';
import { playNotificationSound } from '../utils/notifications';

const STATUS_LABEL = {
  pending: { text: 'Menunggu', className: 'badge-pending' },
  ready: { text: 'Dipanggil', className: 'badge-available' },
};

const getServiceName = (cartItems) => {
  if (!Array.isArray(cartItems)) return 'Layanan';
  const service = cartItems.find((item) => item.type === 'service');
  return service?.name || 'Layanan';
};

const formatCalledNumbers = (calledOrders) =>
  calledOrders.map((o) => `#${o.queue_number}`).join(', ');

export const QueueSection = () => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastCalledRef = useRef(new Set());

  const loadQueue = useCallback(async () => {
    try {
      const data = await api.getPublicQueueBoard();
      setBoard(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    joinQueueRoom('public');
    const socket = getSocket();

    const onUpdate = () => loadQueue();

    const onOrderStatus = async (payload) => {
      loadQueue();
      if (payload.status === 'ready' && payload.queueNumber) {
        const key = `call-${payload.queueNumber}`;
        if (!lastCalledRef.current.has(key)) {
          lastCalledRef.current.add(key);
          await playNotificationSound('turn');
        }
      }
      if (payload.status === 'done' || payload.status === 'cancelled') {
        lastCalledRef.current.delete(`call-${payload.queueNumber}`);
      }
    };

    socket.on('queue_update', onUpdate);
    socket.on('order_status', onOrderStatus);
    socket.on('new_order', onUpdate);
    const interval = setInterval(loadQueue, 30000);
    return () => {
      clearInterval(interval);
      socket.off('queue_update', onUpdate);
      socket.off('order_status', onOrderStatus);
      socket.off('new_order', onUpdate);
    };
  }, [loadQueue]);

  const activeOrders = board?.orders || [];
  const calledOrders = board?.calledOrders || [];

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-surface rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-surface rounded" />
          <div className="h-12 bg-surface rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-5 text-center space-y-2">
        <p className="text-sm text-muted">Gagal memuat antrian</p>
        <p className="text-[11px] text-red-600 break-all">{error}</p>
        <button onClick={loadQueue} className="btn-ghost text-xs mt-1">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink tracking-tight">Papan Antrian</h2>
        <span className="text-[10px] text-muted uppercase tracking-wider">Live</span>
      </div>

      {calledOrders.length > 0 && (
        <div className="card p-5 bg-emerald-600 text-white text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Megaphone size={18} />
            <p className="text-xs uppercase tracking-[0.15em] text-white/80">Silakan menuju kursi</p>
          </div>
          <p className="text-4xl font-light tabular-nums">{formatCalledNumbers(calledOrders)}</p>
          {calledOrders.length === 1 && (
            <p className="text-sm text-white/80 mt-2">
              {calledOrders[0].service_name} — {calledOrders[0].kapster_name || 'Kapster'}
            </p>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="bg-gradient-elegant px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Clock size={16} className="text-white/80" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                {calledOrders.length > 0 ? 'Sedang dipanggil' : 'Belum ada panggilan'}
              </p>
              <p className="text-2xl font-light text-white tabular-nums">
                {board?.currentlyServing != null ? `#${board.currentlyServing}` : '—'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end text-white/50 mb-0.5">
              <Users size={12} />
              <span className="text-[10px] uppercase tracking-wider">
                {board?.pendingCount ?? 0} antrian
              </span>
            </div>
            <p className="text-xs text-white/70">Est. {board?.estimatedWait}</p>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted">Tidak ada antrian saat ini</p>
            <p className="text-xs text-muted/60 mt-1">Silakan pesan layanan untuk mendapatkan nomor antrian</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {activeOrders.map((order) => {
              const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending;
              const isCalled = order.status === 'ready';

              return (
                <li
                  key={order.id}
                  className={`px-5 py-3.5 flex items-center gap-4 ${isCalled ? 'bg-emerald-50/60' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 tabular-nums text-sm font-medium ${
                      isCalled ? 'bg-emerald-600 text-white' : 'bg-surface text-ink border border-line'
                    }`}
                  >
                    {order.queue_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {getServiceName(order.cart_items)}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {order.kapster_name || 'Kapster'}
                    </p>
                  </div>
                  <span className={status.className}>{status.text}</span>
                </li>
              );
            })}
          </ul>
        )}

        {activeOrders.length > 0 && board?.nextNumber != null && (
          <div className="px-5 py-3 bg-surface/40 border-t border-line">
            <p className="text-[11px] text-muted text-center">
              Nomor antrian berikutnya:{' '}
              <span className="text-ink font-medium tabular-nums">#{board.nextNumber}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
