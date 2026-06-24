import pool from '../db.js';

export const getAllServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration, duration_min, image } = req.body;
    const result = await pool.query(
      `INSERT INTO services (name, description, price, duration, duration_min, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || '', price, duration, duration_min || 30, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, duration_min, image } = req.body;
    const result = await pool.query(
      `UPDATE services SET name = $1, description = $2, price = $3, duration = $4, duration_min = $5, image = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
      [name, description, price, duration, duration_min, image, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
