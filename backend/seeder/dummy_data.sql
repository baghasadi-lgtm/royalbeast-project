-- Dummy data only (tanpa drop tables)
-- Jalankan: psql $DATABASE_URL -f seeder/dummy_data.sql

-- Kosongkan order dulu agar tidak duplikat saat re-seed
TRUNCATE orders RESTART IDENTITY CASCADE;

UPDATE queue SET current_number = 4, estimated_wait = '30-45 menit', last_reset = CURRENT_DATE, updated_at = NOW();

-- Reset approval status
UPDATE kapster_service_prices SET pending_harga_jual = NULL, status_pengajuan = 'approved';

INSERT INTO orders (cart_items, total_price, queue_number, queue_position, kapster_id, payment_method, payment_status, status, created_at) VALUES
(
  '[{"type":"service","name":"Haircut Classic","price":55000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":1,"duration":"30 menit"}]'::jsonb,
  55000, 1, 2, 1, 'qris', 'paid', 'pending', NOW() - INTERVAL '18 minutes'
),
(
  '[{"type":"service","name":"Haircut Premium","price":80000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":2,"duration":"45 menit"}]'::jsonb,
  80000, 2, 3, 2, 'cash', 'pending', 'pending', NOW() - INTERVAL '12 minutes'
),
(
  '[{"type":"service","name":"Hair Spa","price":110000,"kapsterId":3,"kapsterName":"Budi Hermawan","serviceId":6,"duration":"60 menit"}]'::jsonb,
  110000, 3, 4, 3, 'qris', 'paid', 'ready', NOW() - INTERVAL '6 minutes'
),
(
  '[{"type":"service","name":"Shaving","price":40000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":3,"duration":"20 menit"}]'::jsonb,
  40000, 4, 5, 1, 'qris', 'paid', 'done', NOW() - INTERVAL '3 hours'
),
(
  '[{"type":"service","name":"Beard Trim","price":35000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":5,"duration":"15 menit"}]'::jsonb,
  35000, 5, 6, 2, 'cash', 'paid', 'done', NOW() - INTERVAL '2 hours'
),
(
  '[{"type":"service","name":"Haircut Classic","price":50000,"kapsterId":2,"kapsterName":"Andi Wijaya","serviceId":1,"duration":"30 menit"},{"type":"product","name":"Pomade Premium","price":85000,"productId":1,"qty":1}]'::jsonb,
  135000, 6, 7, 2, 'qris', 'paid', 'done', NOW() - INTERVAL '90 minutes'
),
(
  '[{"type":"product","name":"Shampoo Anti Dandruff","price":45000,"productId":3,"qty":2},{"type":"product","name":"Body Lotion","price":55000,"productId":6,"qty":1}]'::jsonb,
  145000, NULL, NULL, NULL, 'qris', 'paid', 'done', NOW() - INTERVAL '1 hour'
),
(
  '[{"type":"service","name":"Hair Coloring","price":160000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":4,"duration":"90 menit"}]'::jsonb,
  160000, 8, 9, 1, 'qris', 'paid', 'done', NOW() - INTERVAL '1 day 4 hours'
),
(
  '[{"type":"service","name":"Haircut Premium","price":85000,"kapsterId":3,"kapsterName":"Budi Hermawan","serviceId":2,"duration":"45 menit"}]'::jsonb,
  85000, 9, 10, 3, 'cash', 'paid', 'done', NOW() - INTERVAL '1 day 2 hours'
),
(
  '[{"type":"service","name":"Haircut Classic","price":55000,"kapsterId":1,"kapsterName":"Rudi Santoso","serviceId":1,"duration":"30 menit"}]'::jsonb,
  55000, 10, 11, 1, 'qris', 'paid', 'cancelled', NOW() - INTERVAL '1 day 1 hour'
);

UPDATE kapster_service_prices SET pending_harga_jual = 90000, status_pengajuan = 'pending' WHERE kapster_id = 2 AND service_id = 2;
UPDATE kapster_service_prices SET pending_harga_jual = 60000, status_pengajuan = 'pending' WHERE kapster_id = 1 AND service_id = 1;
