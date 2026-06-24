import pool from '../db.js';
import { getKasBalance } from '../services/accountingService.js';
import { STAFF_COMMISSION_RATE } from '../utils/commission.js';

import { businessToday } from '../utils/businessDate.js';

export const getOwnerDashboard = async (req, res) => {
  try {
    const today = businessToday();

    const [ordersToday, revenueToday, pendingOrders, kas, pendingPrices] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM orders WHERE created_at::date = $1 AND status != 'cancelled'`,
        [today]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total_price), 0)::int AS total FROM orders WHERE created_at::date = $1 AND status != 'cancelled' AND payment_status = 'paid'`,
        [today]
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('pending', 'ready')`),
      getKasBalance(today),
      pool.query(`SELECT COUNT(*)::int AS count FROM kapster_service_prices WHERE status_pengajuan = 'pending'`),
    ]);

    res.json({
      ordersToday: ordersToday.rows[0].count,
      revenueToday: revenueToday.rows[0].total,
      pendingOrders: pendingOrders.rows[0].count,
      kas,
      pendingPriceApprovals: pendingPrices.rows[0].count,
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ error: 'Gagal mengambil dashboard' });
  }
};

export const getKapsterDashboard = async (req, res) => {
  try {
    const kapsterId = req.user.kapsterId;
    if (!kapsterId) {
      return res.status(400).json({ error: 'Akun kapster tidak terhubung' });
    }

    const today = businessToday();

    const [queue, doneToday, revenue, commission] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM orders WHERE kapster_id = $1 AND status IN ('pending', 'ready')`,
        [kapsterId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM orders WHERE kapster_id = $1 AND status = 'done' AND created_at::date = $2`,
        [kapsterId, today]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total_price), 0)::int AS total FROM orders WHERE kapster_id = $1 AND status = 'done' AND payment_status = 'paid' AND created_at::date = $2`,
        [kapsterId, today]
      ),
      pool.query(
        `
        SELECT COALESCE(SUM(
          (SELECT COALESCE(SUM((item->>'price')::int), 0)
           FROM jsonb_array_elements(o.cart_items) item
           WHERE item->>'type' = 'service')
        ), 0)::int AS total
        FROM orders o
        WHERE o.kapster_id = $1 AND o.status = 'done' AND o.payment_status = 'paid' AND o.created_at::date = $2
        `,
        [kapsterId, today]
      ),
    ]);

    const mealAllowance = doneToday.rows[0].count > 0 ? 25000 : 0;

    res.json({
      queueCount: queue.rows[0].count,
      servicesDoneToday: doneToday.rows[0].count,
      revenueToday: revenue.rows[0].total,
      commissionToday: Math.round(commission.rows[0].total * STAFF_COMMISSION_RATE),
      mealAllowance,
    });
  } catch (error) {
    console.error('Kapster dashboard error:', error);
    res.status(500).json({ error: 'Gagal mengambil dashboard' });
  }
};

export const getCashTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cash_transactions ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCashTransaction = async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const result = await pool.query(
      'INSERT INTO cash_transactions (type, amount, description) VALUES ($1, $2, $3) RETURNING *',
      [type, amount, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDiscounts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discounts WHERE active = true ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDiscount = async (req, res) => {
  try {
    const { name, target_type, target_id, percentage, amount } = req.body;
    const result = await pool.query(
      `INSERT INTO discounts (name, target_type, target_id, percentage, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, target_type, target_id, percentage, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    await pool.query('UPDATE discounts SET active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Diskon dinonaktifkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
