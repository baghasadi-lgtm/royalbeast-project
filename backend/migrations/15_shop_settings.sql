CREATE TABLE IF NOT EXISTS shop_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  qris_image TEXT NOT NULL DEFAULT '/qris.jpg',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO shop_settings (id, qris_image)
VALUES (1, '/qris.jpg')
ON CONFLICT (id) DO NOTHING;
