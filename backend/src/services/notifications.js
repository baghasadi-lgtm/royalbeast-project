import { sendPushToTeam } from './pushService.js';

const formatPrice = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export const notifyOwner = async ({ title, message }) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || !chatId) {
    console.log(`[owner-notify] ${title}: ${message}`);
  } else {
    try {
      const text = `*${title}*\n${message}`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
    } catch (error) {
      console.error('Telegram notify error:', error.message);
    }
  }

  try {
    await sendPushToTeam({
      title,
      body: message,
      url: '/admin/orders',
      tag: `team-${title.toLowerCase().replace(/\s+/g, '-')}`,
    });
  } catch (error) {
    console.error('Owner push error:', error.message);
  }
};

export const notifyPaymentReceived = async ({ order, method, confirmedBy }) => {
  const items = Array.isArray(order.cart_items) ? order.cart_items : [];
  const serviceName = items.find((i) => i.type === 'service')?.name || 'Pesanan';

  await notifyOwner({
    title: 'Pembayaran Masuk',
    message: [
      `Order #${order.id}`,
      serviceName,
      `Nominal: ${formatPrice(order.total_price)}`,
      `Metode: ${method.toUpperCase()}`,
      confirmedBy ? `Dikonfirmasi: ${confirmedBy}` : 'Via payment gateway',
      `Waktu: ${new Date().toLocaleString('id-ID')}`,
    ].join('\n'),
  });
};

export const notifyNewOrder = async ({ order, paymentMethod }) => {
  const items = Array.isArray(order.cart_items) ? order.cart_items : [];
  const serviceName = items.find((i) => i.type === 'service')?.name || 'Pesanan';

  await notifyOwner({
    title: 'Pesanan Baru',
    message: [
      `Order #${order.id}`,
      serviceName,
      `Total: ${formatPrice(order.total_price)}`,
      `Bayar: ${paymentMethod.toUpperCase()}`,
      order.queue_number ? `Antrian #${order.queue_number}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  });
};
