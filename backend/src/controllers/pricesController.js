import pool from '../db.js';
import { isStaffRole } from '../middleware/auth.js';
import { calcStaffCommission } from '../utils/commission.js';

const syncKapsterServicesArray = async (kapsterId) => {
  const result = await pool.query(
    `
    SELECT s.name
    FROM kapster_service_prices ksp
    JOIN services s ON s.id = ksp.service_id
    WHERE ksp.kapster_id = $1 AND ksp.is_active = true
  `,
    [kapsterId]
  );
  await pool.query('UPDATE kapsters SET services = $1 WHERE id = $2', [
    result.rows.map((r) => r.name),
    kapsterId,
  ]);
};

export const getKapstersForService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const result = await pool.query(
      `
      SELECT k.*, ksp.harga_jual, ksp.komisi, ksp.status_pengajuan, ksp.pending_harga_jual
      FROM kapsters k
      JOIN kapster_service_prices ksp ON ksp.kapster_id = k.id
      WHERE ksp.service_id = $1
        AND ksp.is_active = true
        AND ksp.status_pengajuan = 'approved'
      ORDER BY k.name ASC
      `,
      [serviceId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPricesByKapster = async (req, res) => {
  try {
    const { kapsterId } = req.params;
    const result = await pool.query(
      `
      SELECT ksp.*, s.name AS service_name, s.duration, s.description, s.price AS base_price
      FROM kapster_service_prices ksp
      JOIN services s ON s.id = ksp.service_id
      WHERE ksp.kapster_id = $1 AND ksp.is_active = true
      ORDER BY s.name
      `,
      [kapsterId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getKapsterServiceCatalog = async (req, res) => {
  try {
    const { kapsterId } = req.params;
    const result = await pool.query(
      `
      SELECT
        s.id AS service_id,
        s.name AS service_name,
        s.description,
        s.duration,
        s.price AS base_price,
        ksp.id AS ksp_id,
        ksp.harga_jual,
        ksp.komisi,
        ksp.status_pengajuan,
        ksp.pending_harga_jual,
        COALESCE(ksp.is_active, false) AS is_active
      FROM services s
      LEFT JOIN kapster_service_prices ksp
        ON ksp.service_id = s.id AND ksp.kapster_id = $1
      ORDER BY s.name
      `,
      [kapsterId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleKapsterService = async (req, res) => {
  try {
    const { kapsterId, serviceId } = req.params;
    const { enabled } = req.body;

    if (isStaffRole(req.user?.role) && req.user.kapsterId !== Number(kapsterId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const service = await pool.query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (service.rows.length === 0) {
      return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    }

    const base = service.rows[0];
    const hargaJual = base.price;
    const komisi = calcStaffCommission(hargaJual);

    if (enabled) {
      await pool.query(
        `
        INSERT INTO kapster_service_prices (kapster_id, service_id, harga_jual, komisi, is_active, status_pengajuan)
        VALUES ($1, $2, $3, $4, true, 'approved')
        ON CONFLICT (kapster_id, service_id)
        DO UPDATE SET is_active = true, harga_jual = COALESCE(kapster_service_prices.harga_jual, EXCLUDED.harga_jual),
          komisi = ROUND(COALESCE(kapster_service_prices.harga_jual, EXCLUDED.harga_jual) * 0.5)
        RETURNING *
        `,
        [kapsterId, serviceId, hargaJual, komisi]
      );
    } else {
      await pool.query(
        `UPDATE kapster_service_prices SET is_active = false WHERE kapster_id = $1 AND service_id = $2`,
        [kapsterId, serviceId]
      );
    }

    await syncKapsterServicesArray(kapsterId);

    const catalog = await pool.query(
      `
      SELECT s.id AS service_id, COALESCE(ksp.is_active, false) AS is_active
      FROM services s
      LEFT JOIN kapster_service_prices ksp ON ksp.service_id = s.id AND ksp.kapster_id = $1
      WHERE s.id = $2
      `,
      [kapsterId, serviceId]
    );

    res.json({ serviceId: Number(serviceId), enabled, is_active: enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePrice = async (req, res) => {
  try {
    const { kapsterId, serviceId } = req.params;
    const { harga_jual, komisi } = req.body;
    const resolvedHarga = harga_jual;
    const resolvedKomisi = komisi ?? (resolvedHarga != null ? calcStaffCommission(resolvedHarga) : null);

    const result = await pool.query(
      `
      UPDATE kapster_service_prices
      SET harga_jual = COALESCE($1, harga_jual),
          komisi = COALESCE($2, ROUND(harga_jual * 0.5))
      WHERE kapster_id = $3 AND service_id = $4
      RETURNING *
      `,
      [resolvedHarga, resolvedKomisi, kapsterId, serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Harga tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const requestPriceChange = async (req, res) => {
  try {
    const { kapsterId, serviceId } = req.params;
    const { harga_jual } = req.body;

    if (isStaffRole(req.user.role) && req.user.kapsterId !== Number(kapsterId)) {
      return res.status(403).json({ error: 'Tidak dapat mengajukan untuk kapster lain' });
    }

    const result = await pool.query(
      `
      UPDATE kapster_service_prices
      SET pending_harga_jual = $1, status_pengajuan = 'pending'
      WHERE kapster_id = $2 AND service_id = $3 AND is_active = true
      RETURNING *
      `,
      [harga_jual, kapsterId, serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layanan tidak aktif atau tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approvePriceChange = async (req, res) => {
  try {
    const { kapsterId, serviceId } = req.params;
    const { approved } = req.body;

    const current = await pool.query(
      'SELECT * FROM kapster_service_prices WHERE kapster_id = $1 AND service_id = $2',
      [kapsterId, serviceId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
    }

    if (approved) {
      const result = await pool.query(
        `
        UPDATE kapster_service_prices
        SET harga_jual = pending_harga_jual,
            komisi = ROUND(pending_harga_jual * 0.5),
            pending_harga_jual = NULL,
            status_pengajuan = 'approved'
        WHERE kapster_id = $1 AND service_id = $2
        RETURNING *
        `,
        [kapsterId, serviceId]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `
      UPDATE kapster_service_prices
      SET pending_harga_jual = NULL, status_pengajuan = 'approved'
      WHERE kapster_id = $1 AND service_id = $2
      RETURNING *
      `,
      [kapsterId, serviceId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPendingApprovals = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT ksp.*, k.name AS kapster_name, s.name AS service_name
      FROM kapster_service_prices ksp
      JOIN kapsters k ON k.id = ksp.kapster_id
      JOIN services s ON s.id = ksp.service_id
      WHERE ksp.status_pengajuan = 'pending'
      ORDER BY ksp.id DESC
      `
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
