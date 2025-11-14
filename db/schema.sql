CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  event TEXT,
  symbol TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  symbol TEXT,
  side TEXT,
  qty INTEGER,
  entry_price DECIMAL,
  stop_price DECIMAL,
  target_price DECIMAL,
  status TEXT,
  pnl DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk (
  id SERIAL PRIMARY KEY,
  daily_loss DECIMAL DEFAULT 0,
  peak_equity DECIMAL DEFAULT 25000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO risk (daily_loss, peak_equity) VALUES (0, 25000)
ON CONFLICT DO NOTHING;
