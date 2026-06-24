CREATE TABLE kapster_service_prices (
  id SERIAL PRIMARY KEY,
  kapster_id INT NOT NULL REFERENCES users(id),
  service_id INT NOT NULL REFERENCES services(id),

  harga_jual INT NOT NULL,
  komisi INT NOT NULL,

  pengajuan_oleh VARCHAR(20) CHECK (pengajuan_oleh IN ('kapster','owner')) DEFAULT 'kapster',
  status_pengajuan VARCHAR(20) CHECK (status_pengajuan IN ('pending','approved','rejected')) DEFAULT 'approved',

  CONSTRAINT unique_kapster_service UNIQUE (kapster_id, service_id)
);
