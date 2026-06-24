INSERT INTO users (username, password_hash, role)
VALUES
('owner1', 'hashed_password', 'owner'),
('andi', 'hashed_pw', 'kapster'),
('bella', 'hashed_pw', 'kapster'),
('ciko', 'hashed_pw', 'kapster');

INSERT INTO kapster_profiles (kapster_id, full_name, gender, age, photo_url, bio)
VALUES
(2, 'Andi Wijaya', 'laki-laki', 27, NULL, 'Ahli haircut'),
(3, 'Bella Putri', 'perempuan', 25, NULL, 'Ahli coloring'),
(4, 'Ciko Ardiansyah', 'laki-laki', 23, NULL, 'Ahli styling');

INSERT INTO services (name, description, duration_min)
VALUES
('Haircut', 'Potong rambut pria', 30),
('Hairwash', 'Cuci rambut + pijat', 20),
('Hair Coloring', 'Cat rambut 1 warna', 90);

INSERT INTO products (name, description, category, price, stock)
VALUES
('Shampoo Menthol', 'Shampoo segar untuk kulit kepala', 'haircare', 50000, 20),
('Pomade Strong Hold', 'Pomade dengan daya tahan kuat', 'styling', 45000, 15),
('Serum Rambut', 'Vitamin rambut cair', 'haircare', 65000, 10);

INSERT INTO kapster_service_prices (kapster_id, service_id, harga_jual, komisi)
VALUES
(2, 1, 70000, 30000),  -- Andi - Haircut
(2, 2, 30000, 10000),  -- Andi - Hairwash
(3, 2, 30000, 10000),  -- Bella - Hairwash
(3, 3, 150000, 50000), -- Bella - Coloring
(4, 1, 70000, 30000);  -- Ciko - Haircut
