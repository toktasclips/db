-- ── Sales Table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT        NOT NULL,
  sale_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  package_name    TEXT,
  amount_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_sales"    ON sales FOR SELECT TO anon    USING (true);
CREATE POLICY "anon_insert_sales"  ON sales FOR INSERT TO anon    WITH CHECK (true);
CREATE POLICY "service_sales_all"  ON sales FOR ALL    TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales (user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date      ON sales (sale_date DESC);
