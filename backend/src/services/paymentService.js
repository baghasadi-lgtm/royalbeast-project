import pool from '../db.js';
import { autoPostOrderRevenue } from './accountingService.js';

export const markOrderPaid = async (client, order, { method, actorUserId = null, notes = null }) => {
  if (order.payment_status === 'paid') {
    return order;
  }

  const updated = await client.query(
    `UPDATE orders
     SET payment_status = 'paid',
         paid_at = CURRENT_TIMESTAMP,
         cash_confirmed_by = COALESCE($2, cash_confirmed_by),
         cash_confirmed_at = CASE WHEN $2 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE cash_confirmed_at END
     WHERE id = $1
     RETURNING *`,
    [order.id, actorUserId]
  );

  const paidOrder = updated.rows[0];

  await client.query(
    `INSERT INTO payment_events (order_id, event_type, amount, payment_method, actor_user_id, notes)
     VALUES ($1, 'paid', $2, $3, $4, $5)`,
    [order.id, order.total_price, method, actorUserId, notes]
  );

  await autoPostOrderRevenue(client, paidOrder, method);

  return paidOrder;
};

export const getOrderPaymentStatus = async (orderId) => {
  const result = await pool.query(
    'SELECT id, payment_status, payment_method, payment_ref, paid_at, total_price FROM orders WHERE id = $1',
    [orderId]
  );
  return result.rows[0] || null;
};
