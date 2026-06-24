# Dummy Data — Royal Beast

Jalankan setelah schema sudah ada (tanpa drop tables):

```bash
cd backend
psql $DATABASE_URL -f seeder/dummy_data.sql
```

Atau reset penuh (schema + dummy):

```bash
npm run db:reset
```

## Yang Tersedia di Dummy Data

### Antrian Kiosk
- Nomor antrian saat ini: **#4**
- Estimasi tunggu: **30-45 menit**
- 3 order jasa aktif di antrian

### Order Aktif (Admin & Kapster Dashboard)
| Antrian | Kapster | Layanan | Pembayaran | Status |
|---------|---------|---------|------------|--------|
| #1 | Rudi | Haircut Classic | QRIS ✓ | pending |
| #2 | Andi | Haircut Premium | Tunai (belum bayar) | pending |
| #3 | Budi | Hair Spa | QRIS ✓ | ready (siap dilayani) |

### Riwayat Hari Ini
- 3 order selesai (termasuk 1 order campuran jasa + produk)
- 1 order produk saja (tanpa antrian)

### Riwayat Kemarin
- 2 order selesai, 1 dibatalkan

### Admin Panel
- 2 pengajuan perubahan harga (Andi & Rudi) di tab **Approval**
- Transaksi kas masuk/keluar
- 2 diskon aktif

### Akun Login
| Username | Password | Role |
|----------|----------|------|
| owner | owner123 | Owner |
| rudi | kapster123 | Kapster Rudi |
| andi | kapster123 | Kapster Andi |
| budi | kapster123 | Kapster Budi |

## Alur Demo yang Bisa Dicoba

1. **Kiosk** → Beranda lihat antrian #4 → Pesan Jasa → pilih layanan & kapster → checkout
2. **Login `rudi`** → Dashboard lihat order #1 pending → klik Selesai
3. **Login `andi`** → Dashboard lihat order #2 tunai → konfirmasi selesai
4. **Login `owner`** → Admin → tab Approval → setujui/tolak harga
5. **Login `owner`** → Kelola Order → lihat 3 order aktif
6. **Barang** → katalog 10 produk, 4 kategori, ada yang habis
