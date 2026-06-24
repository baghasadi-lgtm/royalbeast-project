import pool from '../db.js';
import { verifyMidtransSignature } from '../services/paymentProvider.js';
import { notifyPaymentReceived } from '../services/notifications.js';
import { markOrderPaid } from '../services/paymentService.js';
import { emitOrderPayment } from '../socket.js';

const PAID_STATUSES = new Set(['settlement', 'capture']);

export const confirmPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const order = orderResult.rows[0];

    if (!['cash', 'qris'].includes(order.payment_method)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Metode pembayaran tidak didukung' });
    }

    if (order.payment_status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Pembayaran sudah dikonfirmasi' });
    }

    const updated = await markOrderPaid(client, order, {
      method: order.payment_method,
      actorUserId: req.user.id,
      notes: `Dikonfirmasi staf ${req.user.username}`,
    });

    await client.query('COMMIT');

    emitOrderPayment({ orderId: updated.id, paymentStatus: 'paid' });
    notifyPaymentReceived({
      order: updated,
      method: order.payment_method,
      confirmedBy: req.user.username,
    });

    res.json({ message: 'Pembayaran dikonfirmasi', order: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Gagal konfirmasi pembayaran' });
  } finally {
    client.release();
  }
};

export const confirmCashPayment = confirmPayment;

export const getPaymentStatus = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, payment_status, payment_method, payment_ref, paid_at, total_price FROM orders WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil status pembayaran' });
  }
};

export const handlePaymentWebhook = async (req, res) => {
  const client = await pool.connect();

  try {
    const body = req.body;

    if (process.env.MIDTRANS_SERVER_KEY && !verifyMidtransSignature(body)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const paymentRef = body.order_id;
    const transactionStatus = body.transaction_status;

    if (!paymentRef || !PAID_STATUSES.has(transactionStatus)) {
      return res.json({ message: 'ignored' });
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE payment_ref = $1 FOR UPDATE',
      [paymentRef]
    );

    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const updated = await markOrderPaid(client, order, {
      method: 'qris',
      notes: `Webhook Midtrans: ${transactionStatus}`,
    });

    await client.query('COMMIT');

    emitOrderPayment({ orderId: updated.id, paymentStatus: 'paid' });
    notifyPaymentReceived({ order: updated, method: 'qris' });

    res.json({ message: 'ok' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  } finally {
    client.release();
  }
};

/** Dev/mock only: simulate QRIS payment without gateway */
export const simulateQrisPayment = async (req, res) => {
  if (process.env.PAYMENT_PROVIDER !== 'mock' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Simulasi tidak tersedia' });
  }

  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const order = orderResult.rows[0];

    if (order.payment_method !== 'qris') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Bukan order QRIS' });
    }

    if (order.payment_status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sudah lunas' });
    }

    const updated = await markOrderPaid(client, order, {
      method: 'qris',
      notes: 'Simulasi pembayaran (mode mock)',
    });

    await client.query('COMMIT');

    emitOrderPayment({ orderId: updated.id, paymentStatus: 'paid' });
    notifyPaymentReceived({ order: updated, method: 'qris' });

    res.json({ message: 'Pembayaran QRIS disimulasikan', order: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: 'Gagal simulasi pembayaran' });
  } finally {
    client.release();
  }
};
