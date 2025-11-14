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
  qty INTEGER,
  entry_price DECIMAL,
  stop_price DECIMAL,
  target_price DECIMAL,
  pnl DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
