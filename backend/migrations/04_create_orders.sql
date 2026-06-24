CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  total_harga INT NOT NULL DEFAULT 0,
  metode_pembayaran VARCHAR(20) CHECK (metode_pembayaran IN ('qris','cash')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending','dibayar','selesai','batal')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
