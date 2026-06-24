import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, kapsterId: user.kapster_id },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        kapsterId: user.kapster_id,
        mustChangePassword: user.must_change_password,
        notificationsEnabled: user.notifications_enabled !== false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login gagal' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const user = result.rows[0];
    const validCurrent = await bcrypt.compare(currentPassword || '', user.password_hash);
    if (!validCurrent) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [hash, req.user.id]
    );

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, kapster_id, must_change_password, notifications_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      kapsterId: user.kapster_id,
      mustChangePassword: user.must_change_password,
      notificationsEnabled: user.notifications_enabled !== false,
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
};

export const updateNotificationPreference = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Field enabled (boolean) wajib diisi' });
    }

    await pool.query(
      'UPDATE users SET notifications_enabled = $1 WHERE id = $2',
      [enabled, req.user.id]
    );

    res.json({
      notificationsEnabled: enabled,
      message: enabled ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan',
    });
  } catch (error) {
    console.error('Update notification preference error:', error);
    res.status(500).json({ error: 'Gagal menyimpan preferensi notifikasi' });
  }
};
