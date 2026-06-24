import pool from '../db.js';

export const getAllProducts = async (req, res) => {
  try {
    const { category, kiosk } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const values = [];
    let idx = 1;

    if (category) {
      query += ` AND category = $${idx++}`;
      values.push(category);
    }

    if (kiosk === 'true') {
      query += ` AND status = 'available' AND stock > 0`;
    }

    query += ' ORDER BY category, name';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, status, image } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, description, category, price, stock, status, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || '', category || 'hair_care', price, stock ?? 0, status || 'available', image]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, status, image } = req.body;

    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, category = $3, price = $4,
       stock = $5, status = $6, image = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, description, category, price, stock, status, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
