import { getQrisImage, updateQrisImage } from '../services/settingsService.js';

export const getQrisSetting = async (req, res) => {
  try {
    const qrisImage = await getQrisImage();
    res.json({ qrisImage });
  } catch (error) {
    console.error('Get QRIS setting error:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan QRIS' });
  }
};

export const uploadQrisSetting = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File gambar QRIS wajib diisi' });
    }

    const qrisImage = `/uploads/${req.file.filename}`;
    await updateQrisImage(qrisImage);

    res.json({ qrisImage, message: 'Gambar QRIS berhasil diperbarui' });
  } catch (error) {
    console.error('Upload QRIS error:', error);
    res.status(500).json({ error: 'Gagal memperbarui gambar QRIS' });
  }
};
