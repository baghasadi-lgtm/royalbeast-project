-- Royal Beast Haircut — Full Schema (BRD-aligned)

DROP TABLE IF EXISTS cash_transactions CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;
DROP TABLE IF EXISTS kapster_service_prices CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS kapsters CASCADE;
DROP TABLE IF EXISTS queue CASCADE;

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration VARCHAR(100) NOT NULL,
    duration_min INTEGER DEFAULT 30,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kapsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    image TEXT,
    gender VARCHAR(20),
    age INTEGER,
    bio TEXT,
    services TEXT[],
    portfolio JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'hair_care',
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff', 'kapster')),
    kapster_id INTEGER REFERENCES kapsters(id) ON DELETE SET NULL,
    must_change_password BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kapster_service_prices (
    id SERIAL PRIMARY KEY,
    kapster_id INTEGER NOT NULL REFERENCES kapsters(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    harga_jual INTEGER NOT NULL,
    komisi INTEGER NOT NULL DEFAULT 0,
    status_pengajuan VARCHAR(20) DEFAULT 'approved',
    pending_harga_jual INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(kapster_id, service_id)
);

CREATE TABLE queue (
    id SERIAL PRIMARY KEY,
    current_number INTEGER NOT NULL DEFAULT 1,
    estimated_wait VARCHAR(50) DEFAULT '15-20 menit',
    last_reset DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    cart_items JSONB NOT NULL,
    total_price INTEGER NOT NULL,
    queue_number INTEGER,
    queue_position INTEGER,
    kapster_id INTEGER REFERENCES kapsters(id),
    payment_method VARCHAR(20) DEFAULT 'qris',
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_ref VARCHAR(100),
    paid_at TIMESTAMP,
    cash_confirmed_by INTEGER REFERENCES users(id),
    cash_confirmed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER,
    percentage DECIMAL(5,2),
    amount INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out')),
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_events (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    amount INTEGER,
    payment_method VARCHAR(20),
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO queue (current_number, estimated_wait, last_reset) VALUES (1, '15-20 menit', CURRENT_DATE);

INSERT INTO services (name, description, price, duration, duration_min) VALUES
('Haircut Classic', 'Potong rambut klasik dengan styling sederhana', 50000, '30 menit', 30),
('Haircut Premium', 'Potong rambut premium dengan konsultasi gaya', 75000, '45 menit', 45),
('Shaving', 'Cukur jenggot dan trimming rapi', 35000, '20 menit', 20),
('Hair Coloring', 'Pewarnaan rambut profesional', 150000, '90 menit', 90),
('Beard Trim', 'Trim jenggot presisi', 30000, '15 menit', 15),
('Hair Spa', 'Perawatan spa rambut menyegarkan', 100000, '60 menit', 60);

INSERT INTO kapsters (name, experience, rating, image, gender, age, bio, services, portfolio) VALUES
('Rudi Santoso', '5 tahun', 4.8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
 'Laki-laki', 28, 'Spesialis fade dan classic cut', ARRAY['Haircut Classic', 'Shaving', 'Hair Coloring'],
 '[{"type":"image","url":"https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop"},{"type":"image","url":"https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop"}]'::jsonb),
('Andi Wijaya', '3 tahun', 4.6, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
 'Laki-laki', 24, 'Ahli modern cut dan beard styling', ARRAY['Haircut Classic', 'Beard Trim', 'Haircut Premium'],
 '[{"type":"image","url":"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop"}]'::jsonb),
('Budi Hermawan', '7 tahun', 4.9, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
 'Laki-laki', 32, 'Senior barber dengan pengalaman premium', ARRAY['Haircut Premium', 'Shaving', 'Hair Spa'],
 '[{"type":"image","url":"https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop"}]'::jsonb);

INSERT INTO kapster_service_prices (kapster_id, service_id, harga_jual, komisi)
SELECT k.id, s.id,
  CASE
    WHEN k.id = 1 AND s.name = 'Haircut Classic' THEN 55000
    WHEN k.id = 1 AND s.name = 'Shaving' THEN 40000
    WHEN k.id = 1 AND s.name = 'Hair Coloring' THEN 160000
    WHEN k.id = 2 AND s.name = 'Haircut Classic' THEN 50000
    WHEN k.id = 2 AND s.name = 'Beard Trim' THEN 35000
    WHEN k.id = 2 AND s.name = 'Haircut Premium' THEN 80000
    WHEN k.id = 3 AND s.name = 'Haircut Premium' THEN 85000
    WHEN k.id = 3 AND s.name = 'Shaving' THEN 45000
    WHEN k.id = 3 AND s.name = 'Hair Spa' THEN 110000
    ELSE s.price
  END,
  CASE WHEN k.id = 3 THEN 15000 ELSE 10000 END
FROM kapsters k
CROSS JOIN services s
WHERE s.name = ANY(k.services);

INSERT INTO products (name, description, category, price, stock, status, image) VALUES
('Pomade Premium', 'Pomade hold kuat untuk styling harian', 'hair_care', 85000, 12, 'available', 'https://images.unsplash.com/photo-1598662779094-2220c2fc0f9f?w=300&h=300&fit=crop'),
('Hair Wax', 'Wax matte finish natural look', 'hair_stylist', 65000, 8, 'available', 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=300&h=300&fit=crop'),
('Shampoo Anti Dandruff', 'Shampoo perawatan kulit kepala', 'hair_care', 45000, 15, 'available', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=300&fit=crop'),
('Face Serum', 'Serum wajah glowing dan lembap', 'skincare', 120000, 5, 'available', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&h=300&fit=crop'),
('Beard Oil', 'Minyak jenggot nourishing', 'hair_stylist', 75000, 0, 'unavailable', 'https://images.unsplash.com/photo-1591464206945-91d72d261c5f?w=300&h=300&fit=crop'),
('Body Lotion', 'Lotion tubuh harian lembut', 'body_care', 55000, 10, 'available', 'https://images.unsplash.com/photo-1585388635839-f2df30c96d92?w=300&h=300&fit=crop');

-- password: owner123 / staf123 / kapster123 (bcrypt)
INSERT INTO users (username, password_hash, role, kapster_id, must_change_password) VALUES
('owner', '$2a$10$jHaazhPxqW1qYXrJ4dyDveq5R63liQh5QNUbZhwgzEK0N3mxvWpSW', 'owner', NULL, false),
('staf', '$2a$10$qJG9Jh.qPsVqPJubDXuosu1LjOvXgR7tu5uhuH.faGQHIWIx/wUbm', 'staff', 1, false),
('rudi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 1, false),
('andi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 2, false),
('budi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 3, false);

INSERT INTO cash_transactions (type, amount, description) VALUES
('in', 2500000, 'Modal awal kas');

-- ============================================================
-- DUMMY DATA — untuk demo alur aplikasi
-- ============================================================

-- Antrian sedang di nomor 4 (ada 3 order jasa aktif di depan)
UPDATE queue SET current_number = 4, estimated_wait = '30-45 menit', updated_at = NOW();

-- Order aktif (pending & ready) — muncul di dashboard kapster & admin
INSERT INTO orders (cart_items, total_price, queue_number, queue_position, kapster_id, payment_method, payment_status, status, created_at) VALUES
(
  '[{"type":"service","name":"Haircut Classic","price":55000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":1,"duration":"30 menit"}]'::jsonb,
  55000, 1, 2, 1, 'qris', 'paid', 'pending',
  NOW() - INTERVAL '18 minutes'
),
(
  '[{"type":"service","name":"Haircut Premium","price":80000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":2,"duration":"45 menit"}]'::jsonb,
  80000, 2, 3, 2, 'cash', 'pending', 'pending',
  NOW() - INTERVAL '12 minutes'
),
(
  '[{"type":"service","name":"Hair Spa","price":110000,"kapsterId":3,"kapsterName":"Budi Hermawan","serviceId":6,"duration":"60 menit"}]'::jsonb,
  110000, 3, 4, 3, 'qris', 'paid', 'ready',
  NOW() - INTERVAL '6 minutes'
);

-- Order selesai hari ini — muncul di dashboard & riwayat
INSERT INTO orders (cart_items, total_price, queue_number, queue_position, kapster_id, payment_method, payment_status, status, created_at) VALUES
(
  '[{"type":"service","name":"Shaving","price":40000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":3,"duration":"20 menit"}]'::jsonb,
  40000, 4, 5, 1, 'qris', 'paid', 'done',
  NOW() - INTERVAL '3 hours'
),
(
  '[{"type":"service","name":"Beard Trim","price":35000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":5,"duration":"15 menit"}]'::jsonb,
  35000, 5, 6, 2, 'cash', 'paid', 'done',
  NOW() - INTERVAL '2 hours'
),
(
  '[{"type":"service","name":"Haircut Classic","price":50000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":1,"duration":"30 menit"},{"type":"product","name":"Pomade Premium","price":85000,"productId":1,"qty":1}]'::jsonb,
  135000, 6, 7, 2, 'qris', 'paid', 'done',
  NOW() - INTERVAL '90 minutes'
),
(
  '[{"type":"product","name":"Shampoo Anti Dandruff","price":45000,"productId":3,"qty":2},{"type":"product","name":"Body Lotion","price":55000,"productId":6,"qty":1}]'::jsonb,
  145000, NULL, NULL, NULL, 'qris', 'paid', 'done',
  NOW() - INTERVAL '1 hour'
);

-- Order kemarin — riwayat historis
INSERT INTO orders (cart_items, total_price, queue_number, queue_position, kapster_id, payment_method, payment_status, status, created_at) VALUES
(
  '[{"type":"service","name":"Hair Coloring","price":160000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":4,"duration":"90 menit"}]'::jsonb,
  160000, 8, 9, 1, 'qris', 'paid', 'done',
  NOW() - INTERVAL '1 day 4 hours'
),
(
  '[{"type":"service","name":"Haircut Premium","price":85000,"kapsterId":3,"kapsterName":"Budi Hermawan","serviceId":2,"duration":"45 menit"}]'::jsonb,
  85000, 9, 10, 3, 'cash', 'paid', 'done',
  NOW() - INTERVAL '1 day 2 hours'
),
(
  '[{"type":"service","name":"Haircut Classic","price":55000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":1,"duration":"30 menit"}]'::jsonb,
  55000, 10, 11, 1, 'qris', 'paid', 'cancelled',
  NOW() - INTERVAL '1 day 1 hour'
);

-- Pengajuan perubahan harga — muncul di tab Approval admin
UPDATE kapster_service_prices
SET pending_harga_jual = 90000, status_pengajuan = 'pending'
WHERE kapster_id = 2 AND service_id = 2;

UPDATE kapster_service_prices
SET pending_harga_jual = 60000, status_pengajuan = 'pending'
WHERE kapster_id = 1 AND service_id = 1;

-- Diskon aktif
INSERT INTO discounts (name, target_type, target_id, percentage, active) VALUES
('Promo Haircut Classic', 'service', 1, 10.00, true),
('Diskon Pomade', 'product', 1, 15.00, true);

-- Transaksi kas tambahan
INSERT INTO cash_transactions (type, amount, description, created_at) VALUES
('in', 55000, 'Order #1 QRIS — Haircut Classic Rudi', NOW() - INTERVAL '18 minutes'),
('in', 40000, 'Order selesai — Shaving Rudi', NOW() - INTERVAL '3 hours'),
('in', 35000, 'Order selesai — Beard Trim Andi (tunai)', NOW() - INTERVAL '2 hours'),
('in', 135000, 'Order selesai — Haircut + Pomade Andi', NOW() - INTERVAL '90 minutes'),
('in', 145000, 'Order produk — Shampoo + Body Lotion', NOW() - INTERVAL '1 hour'),
('out', 150000, 'Beli stok produk baru', NOW() - INTERVAL '5 hours'),
('out', 50000, 'Biaya operasional harian', NOW() - INTERVAL '1 day');

-- Produk tambahan untuk katalog lebih kaya
INSERT INTO products (name, description, category, price, stock, status, image) VALUES
('Conditioner Repair', 'Perbaiki rambut rusak dan kering', 'hair_care', 52000, 7, 'available', 'https://images.unsplash.com/photo-1535585208547-8f456b09e5c1?w=300&h=300&fit=crop'),
('Clay Pomade', 'Matte finish clay untuk gaya modern', 'hair_stylist', 95000, 4, 'available', 'https://images.unsplash.com/photo-1620916565348-097fb052f5b1?w=300&h=300&fit=crop'),
('Sunscreen SPF50', 'Tabir surya wajah ringan', 'skincare', 89000, 3, 'available', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop'),
('Hand Cream', 'Krim tangan melembapkan', 'body_care', 38000, 0, 'unavailable', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop');
