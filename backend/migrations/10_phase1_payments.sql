-- Phase 1: payment tracking + staff role

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'staff', 'kapster'));

UPDATE users SET role = 'staff' WHERE role = 'kapster';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_confirmed_by INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_confirmed_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS payment_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  amount INTEGER,
  payment_method VARCHAR(20),
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders(payment_ref);
