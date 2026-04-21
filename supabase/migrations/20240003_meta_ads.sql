-- ── Meta Ads Integration ──────────────────────────────────────────────

-- 1. Store user-level access token alongside page token
--    (Ads API requires user token, not page token)
ALTER TABLE instagram_connections
  ADD COLUMN IF NOT EXISTS encrypted_user_token TEXT;

-- 2. meta_ad_insights — daily ad spend per ad account
CREATE TABLE IF NOT EXISTS meta_ad_insights (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  account_id   TEXT        NOT NULL,   -- e.g. "act_123456789"
  account_name TEXT,
  insight_date DATE        NOT NULL,
  spend        NUMERIC(12,2) DEFAULT 0,
  impressions  BIGINT      DEFAULT 0,
  reach        BIGINT      DEFAULT 0,
  clicks       BIGINT      DEFAULT 0,
  currency     TEXT        DEFAULT 'TRY',
  raw_payload  JSONB,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, account_id, insight_date)
);

-- 3. RLS
ALTER TABLE meta_ad_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_own_ad_insights" ON meta_ad_insights
  FOR SELECT TO anon USING (true);

CREATE POLICY "service_ad_insights_all" ON meta_ad_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_meta_ad_user_date
  ON meta_ad_insights (user_id, insight_date DESC);
