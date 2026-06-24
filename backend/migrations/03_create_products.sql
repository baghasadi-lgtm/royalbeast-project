CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price INT NOT NULL,
  stock INT DEFAULT 0,
  status BOOLEAN DEFAULT TRUE
);