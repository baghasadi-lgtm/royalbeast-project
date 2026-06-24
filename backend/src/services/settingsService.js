import pool from '../db.js';

export const DEFAULT_QRIS_IMAGE = '/qris.jpg';

export const getQrisImage = async () => {
  try {
    const result = await pool.query('SELECT qris_image FROM shop_settings WHERE id = 1');
    return result.rows[0]?.qris_image || DEFAULT_QRIS_IMAGE;
  } catch {
    return DEFAULT_QRIS_IMAGE;
  }
};

export const updateQrisImage = async (imagePath) => {
  await pool.query(
    `
    INSERT INTO shop_settings (id, qris_image, updated_at)
    VALUES (1, $1, NOW())
    ON CONFLICT (id) DO UPDATE SET
      qris_image = EXCLUDED.qris_image,
      updated_at = NOW()
    `,
    [imagePath]
  );
};
