import bcrypt from 'bcryptjs';
import pool from '../db.js';

export const listUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.kapster_id, u.must_change_password, u.created_at,
              k.name AS kapster_name
       FROM users u
       LEFT JOIN kapsters k ON k.id = u.kapster_id
       WHERE u.role != 'owner'
       ORDER BY u.username ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil daftar akun' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, password, role = 'staff', kapsterId } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    if (!['staff', 'kapster'].includes(role)) {
      return res.status(400).json({ error: 'Role harus staff atau kapster' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, kapster_id, must_change_password)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, role, kapster_id, must_change_password, created_at`,
      [username.trim().toLowerCase(), hash, role, kapsterId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username sudah dipakai' });
    }
    console.error(error);
    res.status(500).json({ error: 'Gagal membuat akun' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: 'Tidak bisa hapus akun sendiri' });
    }

    const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (target.rowCount === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
    if (target.rows[0].role === 'owner') {
      return res.status(403).json({ error: 'Tidak bisa hapus akun owner' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Akun dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus akun' });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (target.rowCount === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
    if (target.rows[0].role === 'owner' && req.user.id !== Number(id)) {
      return res.status(403).json({ error: 'Hanya owner yang bisa reset password sendiri' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2',
      [hash, id]
    );
    res.json({ message: 'Password direset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal reset password' });
  }
};
