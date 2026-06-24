import pool from '../db.js';
import { emitNewOrder, emitOrderStatus } from '../socket.js';
import { createQrisPayment, getPaymentProvider } from '../services/paymentProvider.js';
import { notifyNewOrder } from '../services/notifications.js';
import { markOrderPaid } from '../services/paymentService.js';
import { autoPostOrderCompletion } from '../services/accountingAutoPost.js';

const getServiceNameFromCart = (cartItems) => {
  if (!Array.isArray(cartItems)) return 'Layanan';
  const service = cartItems.find((item) => item.type === 'service');
  return service?.name || 'Layanan';
};

const resetQueueIfNeeded = async (client) => {
  await client.query(`
    UPDATE queue
    SET current_number = 1,
        last_reset = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE last_reset < CURRENT_DATE
  `);
};

const countActiveQueueToday = async (client) => {
  const result = await client.query(`
    SELECT COUNT(*)::int AS count FROM orders
    WHERE status IN ('pending', 'ready')
      AND queue_number IS NOT NULL
      AND created_at::date = CURRENT_DATE
  `);
  return result.rows[0].count;
};

/** Reset nomor antrian ke 1 jika tidak ada yang menunggu hari ini */
const resetQueueIfEmpty = async (client) => {
  const count = await countActiveQueueToday(client);
  if (count === 0) {
    await client.query(`
      UPDATE queue
      SET current_number = 1,
          updated_at = CURRENT_TIMESTAMP
    `);
  }
};

const calcEstimatedWait = async (client, serviceCount) => {
  const pending = await client.query(
    `SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('pending', 'ready')`
  );
  const waitMin = (pending.rows[0].count + serviceCount) * 15;
  const label = waitMin <= 15 ? '10-15 menit' : waitMin <= 30 ? '15-30 menit' : `${waitMin - 15}-${waitMin} menit`;
  return label;
};

export const getCurrentQueue = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await resetQueueIfNeeded(client);

    const result = await client.query('SELECT * FROM queue LIMIT 1');
    const pending = await client.query(
      `SELECT COUNT(*)::int AS count FROM orders
       WHERE status IN ('pending', 'ready')
         AND queue_number IS NOT NULL
         AND created_at::date = CURRENT_DATE`
    );

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.json({ current: 1, estimatedWait: '15-20 menit', pendingCount: 0 });
    }

    const waitMin = pending.rows[0].count * 15;
    const estimatedWait = waitMin <= 15 ? '10-15 menit' : waitMin <= 30 ? '15-30 menit' : `${waitMin}-${waitMin + 15} menit`;

    res.json({
      current: pending.rows[0].count === 0 ? 1 : result.rows[0].current_number,
      estimatedWait,
      pendingCount: pending.rows[0].count,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  } finally {
    client.release();
  }
};

export const getPublicQueueBoard = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await resetQueueIfNeeded(client);

    const [queueResult, ordersResult, calledResult] = await Promise.all([
      client.query('SELECT current_number FROM queue LIMIT 1'),
      client.query(`
        SELECT o.id, o.queue_number, o.status, o.cart_items, k.name AS kapster_name
        FROM orders o
        LEFT JOIN kapsters k ON o.kapster_id = k.id
        WHERE o.status IN ('pending', 'ready')
          AND o.queue_number IS NOT NULL
          AND o.created_at::date = CURRENT_DATE
        ORDER BY o.queue_number ASC
      `),
      client.query(`
        SELECT o.queue_number, o.cart_items, k.name AS kapster_name
        FROM orders o
        LEFT JOIN kapsters k ON o.kapster_id = k.id
        WHERE o.status = 'ready'
          AND o.queue_number IS NOT NULL
          AND o.created_at::date = CURRENT_DATE
        ORDER BY o.queue_number ASC
      `),
    ]);

    await client.query('COMMIT');

    const orders = ordersResult.rows;
    const calledOrders = calledResult.rows.map((row) => ({
      queue_number: row.queue_number,
      kapster_name: row.kapster_name,
      service_name: getServiceNameFromCart(row.cart_items),
    }));
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const waitMin = pendingCount * 15;
    const estimatedWait =
      pendingCount === 0
        ? '10-15 menit'
        : waitMin <= 15
          ? '10-15 menit'
          : waitMin <= 30
            ? '15-30 menit'
            : `${waitMin}-${waitMin + 15} menit`;

    res.json({
      currentlyServing: calledOrders[0]?.queue_number ?? null,
      calledOrders,
      nextNumber: pendingCount === 0 && calledOrders.length === 0 ? 1 : (queueResult.rows[0]?.current_number ?? 1),
      estimatedWait,
      pendingCount: orders.length,
      orders,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fetching queue board:', error);
    res.status(500).json({ error: 'Failed to fetch queue board' });
  } finally {
    client.release();
  }
};

export const checkout = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await resetQueueIfNeeded(client);

    const { cartItems, kapsterId, paymentMethod = 'qris' } = req.body;

    if (!cartItems?.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Keranjang kosong' });
    }

    for (const item of cartItems) {
      if (item.type === 'product') {
        const product = await client.query('SELECT stock, status FROM products WHERE id = $1 FOR UPDATE', [item.productId || item.id]);
        if (product.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Produk ${item.name} tidak ditemukan` });
        }
        const qty = item.qty || 1;
        if (product.rows[0].status !== 'available' || product.rows[0].stock < qty) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Stok ${item.name} tidak mencukupi` });
        }
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, item.productId || item.id]);
        if (product.rows[0].stock - qty <= 0) {
          await client.query(`UPDATE products SET status = 'unavailable' WHERE id = $1`, [item.productId || item.id]);
        }
      }
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
    const serviceCount = cartItems.filter((item) => item.type === 'service').length;

    if (serviceCount > 0) {
      await resetQueueIfEmpty(client);
    }

    const queueResult = await client.query(
      'SELECT id, current_number FROM queue ORDER BY id LIMIT 1 FOR UPDATE'
    );
    const queueRow = queueResult.rows[0];
    const currentQueue = queueRow.current_number;
    const queuePosition = currentQueue + serviceCount;
    const queueNumber = serviceCount > 0 ? currentQueue : null;

    let paymentStatus = 'pending';
    let paymentRef = null;
    let qrisUrl = null;
    let qrString = null;
    let qrisImage = null;

    const orderResult = await client.query(
      `INSERT INTO orders (cart_items, total_price, queue_number, queue_position, kapster_id, payment_method, payment_status, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [JSON.stringify(cartItems), totalPrice, queueNumber, queuePosition, kapsterId || null, paymentMethod, paymentStatus]
    );

    const order = orderResult.rows[0];

    if (paymentMethod === 'qris') {
      const payment = await createQrisPayment({ orderId: order.id, amount: totalPrice });
      paymentRef = payment.paymentRef;
      qrisUrl = payment.qrisUrl;
      qrString = payment.qrString;
      qrisImage = payment.qrisImage || null;

      await client.query('UPDATE orders SET payment_ref = $1 WHERE id = $2', [paymentRef, order.id]);

      if (payment.paymentStatus === 'paid') {
        const paidOrder = await markOrderPaid(client, order, { method: 'qris', notes: 'Instant settlement' });
        paymentStatus = 'paid';
        Object.assign(order, paidOrder);
      }
    }

    await client.query(
      `INSERT INTO payment_events (order_id, event_type, amount, payment_method, notes)
       VALUES ($1, 'created', $2, $3, $4)`,
      [order.id, totalPrice, paymentMethod, paymentMethod === 'qris' ? `Ref: ${paymentRef}` : 'Menunggu konfirmasi tunai']
    );

    if (serviceCount > 0) {
      await client.query(
        `UPDATE queue SET current_number = current_number + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [serviceCount, queueRow.id]
      );
    }

    const estimatedWait = await calcEstimatedWait(client, serviceCount);
    await client.query('COMMIT');

    order.payment_ref = paymentRef;
    order.payment_status = paymentStatus;

    const serviceItem = cartItems.find((i) => i.type === 'service');

    emitNewOrder(kapsterId, {
      orderId: order.id,
      queueNumber,
      totalPrice,
      kapsterId,
      serviceName: serviceItem?.name,
      paymentMethod,
      paymentStatus,
      status: 'pending',
    });

    notifyNewOrder({ order, paymentMethod });

    res.status(201).json({
      queueNumber,
      queuePosition,
      estimatedWait,
      paymentMethod,
      paymentStatus,
      totalPrice,
      paymentRef,
      qrisUrl,
      qrString,
      qrisImage,
      paymentProvider: getPaymentProvider(),
      order,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, k.name AS kapster_name FROM orders o LEFT JOIN kapsters k ON o.kapster_id = k.id ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getActiveOrders = async (req, res) => {
  try {
    const { kapsterId } = req.query;
    let query = `
      SELECT o.*, k.name AS kapster_name
      FROM orders o
      LEFT JOIN kapsters k ON o.kapster_id = k.id
      WHERE o.status IN ('pending', 'ready')
    `;
    const values = [];

    if (kapsterId) {
      query += ' AND o.kapster_id = $1';
      values.push(Number(kapsterId));
    }

    query += ' ORDER BY o.queue_number ASC NULLS LAST, o.created_at ASC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ready', 'done', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.status === 'done' || order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order already processed' });
    }

    if (status !== 'cancelled' && order.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Pembayaran belum dikonfirmasi. Konfirmasi tunai atau tunggu QRIS lunas dulu.',
      });
    }

    const updatedOrder = await client.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (status === 'done') {
      await autoPostOrderCompletion(client, updatedOrder.rows[0]);
    }

    if (status === 'done' || status === 'cancelled') {
      await resetQueueIfEmpty(client);
    }

    await client.query('COMMIT');

    const updated = updatedOrder.rows[0];
    emitOrderStatus({
      orderId: updated.id,
      kapsterId: updated.kapster_id,
      queueNumber: updated.queue_number,
      status,
      totalPrice: updated.total_price,
    });

    res.json({ message: `Order ${status}`, order: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  } finally {
    client.release();
  }
};

export const getReceiptByQueue = async (req, res) => {
  try {
    const queueNumber = Number(req.params.queueNumber);
    if (!queueNumber) {
      return res.status(400).json({ error: 'Nomor antrian tidak valid' });
    }

    const orderResult = await pool.query(
      `
      SELECT o.*, k.name AS kapster_name
      FROM orders o
      LEFT JOIN kapsters k ON o.kapster_id = k.id
      WHERE o.queue_number = $1
        AND o.created_at::date = CURRENT_DATE
      ORDER BY o.created_at DESC
      LIMIT 1
      `,
      [queueNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    }

    const order = orderResult.rows[0];
    const serviceCount = (Array.isArray(order.cart_items) ? order.cart_items : []).filter(
      (i) => i.type === 'service'
    ).length;
    const estimatedWait = await calcEstimatedWait(pool, serviceCount);

    res.json({
      order,
      totalPrice: Number(order.total_price),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      queueNumber: order.queue_number,
      queuePosition: order.queue_position,
      estimatedWait,
    });
  } catch (error) {
    console.error('Receipt error:', error);
    res.status(500).json({ error: 'Gagal memuat invoice' });
  }
};

export const trackOrderByQueue = async (req, res) => {
  try {
    const queueNumber = Number(req.params.queueNumber);
    if (!queueNumber) {
      return res.status(400).json({ error: 'Nomor antrian tidak valid' });
    }

    const orderResult = await pool.query(
      `
      SELECT o.*, k.name AS kapster_name
      FROM orders o
      LEFT JOIN kapsters k ON o.kapster_id = k.id
      WHERE o.queue_number = $1
        AND o.created_at::date = CURRENT_DATE
      ORDER BY o.created_at DESC
      LIMIT 1
      `,
      [queueNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Antrian tidak ditemukan' });
    }

    const order = orderResult.rows[0];
    const cartItems = order.cart_items;
    const serviceItem = Array.isArray(cartItems)
      ? cartItems.find((i) => i.type === 'service')
      : null;

    const [servingResult, aheadResult, queueResult] = await Promise.all([
      pool.query(
        `SELECT MIN(queue_number)::int AS serving FROM orders
         WHERE status = 'ready' AND queue_number IS NOT NULL AND created_at::date = CURRENT_DATE`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM orders
         WHERE status = 'pending' AND queue_number IS NOT NULL
           AND queue_number < $1 AND created_at::date = CURRENT_DATE`,
        [queueNumber]
      ),
      pool.query('SELECT current_number, estimated_wait FROM queue LIMIT 1'),
    ]);

    const peopleAhead = aheadResult.rows[0].count;
    const currentlyServing = servingResult.rows[0].serving;
    const waitMin = (peopleAhead + 1) * 15;
    const estimatedWait =
      peopleAhead === 0
        ? '5-10 menit'
        : waitMin <= 30
          ? '15-30 menit'
          : `${waitMin}-${waitMin + 15} menit`;

    res.json({
      orderId: order.id,
      queueNumber: order.queue_number,
      status: order.status,
      kapsterName: order.kapster_name || serviceItem?.kapsterName,
      serviceName: serviceItem?.name || 'Layanan',
      peopleAhead,
      currentlyServing,
      nextNumber: queueResult.rows[0]?.current_number,
      estimatedWait,
      isDone: order.status === 'done',
      isCancelled: order.status === 'cancelled',
      isYourTurn: order.status === 'ready',
      isAlmostTurn: peopleAhead === 1 && order.status === 'pending',
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Gagal melacak antrian' });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const { date, kapsterId } = req.query;

    let query = `
      SELECT o.*, k.name AS kapster_name
      FROM orders o
      LEFT JOIN kapsters k ON o.kapster_id = k.id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (date) {
      query += ` AND o.created_at::date = $${index++}`;
      values.push(date);
    }

    if (kapsterId) {
      query += ` AND o.kapster_id = $${index++}`;
      values.push(Number(kapsterId));
    }

    query += ` ORDER BY o.created_at DESC`;
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
