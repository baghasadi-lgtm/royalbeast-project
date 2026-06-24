import pool from '../db.js';

/**
 * GET active orders (kapster)
 */
export const getActiveOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, cart_items, total_price, queue_number, queue_position
      FROM orders
      WHERE status = 'pending'
      ORDER BY queue_number ASC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * UPDATE order status + update queue
 */
export const updateOrderStatus = async (req, res) => {
await resetQueueIfNeeded(pool);
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['done', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.query('BEGIN');

    // Lock order
    const orderResult = await client.query(
      `
      SELECT id, status, cart_items
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Order already processed'
      });
    }

    // Hitung jumlah service
    const serviceCount = order.cart_items.filter(
      item => item.type === 'service'
    ).length;

    // Update order status
    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    // Lock queue
    const queueResult = await client.query(
      `
      SELECT id, current_number
      FROM queue
      ORDER BY id
      LIMIT 1
      FOR UPDATE
      `
    );

    const queue = queueResult.rows[0];

    // Geser queue
    await client.query(
      `
      UPDATE queue
      SET current_number = current_number + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [serviceCount, queue.id]
    );

    await client.query('COMMIT');

    res.json({
      message: `Order ${status}`,
      order: updatedOrder.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  } finally {
    client.release();
  }
};
