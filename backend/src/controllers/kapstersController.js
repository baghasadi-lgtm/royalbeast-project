import pool from '../db.js';

const parsePortfolio = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const canEditKapster = (user, kapsterId) => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (isStaffRole(user) && user.kapsterId === Number(kapsterId)) return true;
  return false;
};

const isStaffRole = (user) => ['staff', 'kapster'].includes(user.role);

// Get all kapsters
export const getAllKapsters = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kapsters ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching kapsters:', error);
    res.status(500).json({ error: 'Failed to fetch kapsters' });
  }
};

// Get kapster by ID
export const getKapsterById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM kapsters WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching kapster:', error);
    res.status(500).json({ error: 'Failed to fetch kapster' });
  }
};

// Create kapster
export const createKapster = async (req, res) => {
  try {
    const { name, experience, image, services, portfolio } = req.body;

    const result = await pool.query(
      'INSERT INTO kapsters (name, experience, rating, image, services, portfolio) VALUES ($1, $2, 0, $3, $4, $5) RETURNING *',
      [name, experience, image, services, JSON.stringify(portfolio || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating kapster:', error);
    res.status(500).json({ error: 'Failed to create kapster' });
  }
};

// Update kapster
export const updateKapster = async (req, res) => {
  try {
    const { id } = req.params;

    if (!canEditKapster(req.user, id)) {
      return res.status(403).json({ error: 'Tidak punya akses edit profil ini' });
    }

    const current = await pool.query('SELECT * FROM kapsters WHERE id = $1', [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    const row = current.rows[0];
    const name = req.body.name ?? row.name;
    const experience = req.body.experience ?? row.experience;

    const imageFile = req.files?.image?.[0]?.filename;
    const image = imageFile ? `/uploads/${imageFile}` : row.image;

    let existingPortfolio = parsePortfolio(row.portfolio);
    if (req.body.existingPortfolio) {
      try {
        existingPortfolio = JSON.parse(req.body.existingPortfolio);
      } catch {
        // keep DB portfolio
      }
    }

    const portfolioFiles = req.files?.portfolio || [];
    const newItems = portfolioFiles.map((file) => ({
      type: file.mimetype.startsWith('video') ? 'video' : 'image',
      url: `/uploads/${file.filename}`,
    }));

    const portfolio = [...existingPortfolio, ...newItems];

    const result = await pool.query(
      `UPDATE kapsters
       SET name = $1,
           experience = $2,
           image = $3,
           portfolio = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, experience, image, JSON.stringify(portfolio), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
};

// Owner: update metadata tanpa upload file (admin panel)
export const updateKapsterMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, experience, services, image } = req.body;

    const result = await pool.query(
      `UPDATE kapsters
       SET name = COALESCE($1, name),
           experience = COALESCE($2, experience),
           services = COALESCE($3, services),
           image = COALESCE($4, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, experience, services, image, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update kapster' });
  }
};

// Delete kapster
export const deleteKapster = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM kapsters WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    res.json({ message: 'Kapster deleted successfully' });
  } catch (error) {
    console.error('Error deleting kapster:', error);
    res.status(500).json({ error: 'Failed to delete kapster' });
  }
};

// Kapster add service (many-to-many relationship)
export const kapsterAddService = async (req, res) => {
  try {
    const { kapsterId } = req.params;
    const { serviceId } = req.body;

    const kapster = await pool.query('SELECT * FROM kapsters WHERE id = $1', [kapsterId]);
    if (kapster.rows.length === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    const service = await pool.query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (service.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const currentServices = kapster.rows[0].services || [];
    const serviceName = service.rows[0].name;

    if (!currentServices.includes(serviceName)) {
      currentServices.push(serviceName);

      const result = await pool.query(
        'UPDATE kapsters SET services = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [currentServices, kapsterId]
      );

      res.json(result.rows[0]);
    } else {
      res.status(400).json({ error: 'Service already added to this kapster' });
    }
  } catch (error) {
    console.error('Error adding service to kapster:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
};

// Get services by kapster
export const getServicesByKapster = async (req, res) => {
  try {
    const { kapsterId } = req.params;

    const result = await pool.query('SELECT services FROM kapsters WHERE id = $1', [kapsterId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kapster not found' });
    }

    res.json({ services: result.rows[0].services || [] });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Get kapsters by service
export const getKapstersByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await pool.query('SELECT name FROM services WHERE id = $1', [serviceId]);
    if (service.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceName = service.rows[0].name;

    const result = await pool.query('SELECT * FROM kapsters WHERE $1 = ANY(services)', [serviceName]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching kapsters:', error);
    res.status(500).json({ error: 'Failed to fetch kapsters' });
  }
};
