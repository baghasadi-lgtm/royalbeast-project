import { useEffect, useState } from 'react';
import { getSocket, joinAdminRoom } from '../utils/socket';
import { showQueueNotification, playNotificationSound } from '../utils/notifications';
import { areNotificationsEnabled } from '../utils/pushNotifications';

export const useNewOrderAlerts = (onRefresh) => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    joinAdminRoom();
    const socket = getSocket();

    const onNewOrder = async (payload) => {
      if (!areNotificationsEnabled()) return;
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
        data: { url: '/admin/orders' },
      });
      if (!notified) await playNotificationSound('new-order');
      onRefresh?.();
    };

    const onOrderStatus = (payload) => {
      if (payload.status === 'done' || payload.status === 'cancelled') {
        setToast((prev) => (prev?.orderId === payload.orderId ? null : prev));
      }
      onRefresh?.();
    };

    const onPayment = () => onRefresh?.();

    socket.on('new_order', onNewOrder);
    socket.on('order_status', onOrderStatus);
    socket.on('order_payment', onPayment);

    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('order_status', onOrderStatus);
      socket.off('order_payment', onPayment);
    };
  }, [onRefresh]);

  return { toast, dismissToast: () => setToast(null) };
};
