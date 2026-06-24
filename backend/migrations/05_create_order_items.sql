CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),

  service_id INT REFERENCES services(id),
  kapster_id INT REFERENCES users(id),

  product_id INT REFERENCES products(id),

  qty INT NOT NULL DEFAULT 1,
  harga_satuan INT NOT NULL
);
