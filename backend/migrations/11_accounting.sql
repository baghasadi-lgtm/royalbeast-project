-- Modul akuntansi double-entry (selaras Excel Royal Beast)

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'contra_asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference VARCHAR(50),
  description TEXT,
  entry_type VARCHAR(30) DEFAULT 'general' CHECK (entry_type IN ('general', 'adjusting', 'auto', 'closing')),
  source_type VARCHAR(30),
  source_id INTEGER,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
  debit INTEGER NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit INTEGER NOT NULL DEFAULT 0 CHECK (credit >= 0),
  line_description TEXT,
  CHECK (NOT (debit > 0 AND credit > 0))
);

CREATE TABLE IF NOT EXISTS fixed_assets (
  id SERIAL PRIMARY KEY,
  acquired_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquisition_cost INTEGER NOT NULL,
  useful_life_years INTEGER NOT NULL,
  annual_depreciation INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);

-- Chart of Accounts (sesuai Excel)
INSERT INTO chart_of_accounts (code, name, account_type, normal_balance) VALUES
('1-001', 'Kas', 'asset', 'debit'),
('1-002', 'Akumulasi Depresiasi', 'contra_asset', 'credit'),
('1-003', 'Peralatan Barber', 'asset', 'debit'),
('3-001', 'Modal Owner', 'equity', 'credit'),
('3-002', 'Prive / Pengambilan Pemilik', 'equity', 'debit'),
('4-001', 'Pendapatan Jasa', 'revenue', 'credit'),
('4-002', 'Pendapatan Produk', 'revenue', 'credit'),
('5-001', 'Beban Gaji & Bagi Hasil Pegawai', 'expense', 'debit'),
('5-002', 'Beban Konsumsi Pegawai (Makan)', 'expense', 'debit'),
('5-003', 'Beban Internet (Wifi)', 'expense', 'debit'),
('5-004', 'Beban Perlengkapan Operasional', 'expense', 'debit'),
('5-005', 'Beban Listrik', 'expense', 'debit'),
('5-006', 'Beban Iuran', 'expense', 'debit'),
('5-007', 'Beban Depresiasi', 'expense', 'debit')
ON CONFLICT (code) DO NOTHING;
