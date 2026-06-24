-- Akun awal production / Supabase (ganti password setelah deploy!)
-- owner123 | staf123 | kapster123
INSERT INTO users (username, password_hash, role, kapster_id, must_change_password) VALUES
('owner', '$2a$10$jHaazhPxqW1qYXrJ4dyDveq5R63liQh5QNUbZhwgzEK0N3mxvWpSW', 'owner', NULL, false),
('staf', '$2a$10$qJG9Jh.qPsVqPJubDXuosu1LjOvXgR7tu5uhuH.faGQHIWIx/wUbm', 'staff', 1, false),
('rudi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 1, false),
('andi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 2, false),
('budi', '$2a$10$N33de0z36REuOdv0OccAJuTuGNg5.MOj8wBlsMGMtAuHA8qjfbIAK', 'staff', 3, false)
ON CONFLICT (username) DO NOTHING;
