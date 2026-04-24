-- ── Instagram Schema Fixes ────────────────────────────────────────────
-- Adds missing columns that instagram-sync upserts but weren't in the
-- original migration, and creates the missing instagram_media_daily_stats
-- table referenced in instagram-sync/index.ts.

-- ── 1. Add missing columns to instagram_account_snapshots ─────────────
ALTER TABLE instagram_account_snapshots
  ADD COLUMN IF NOT EXISTS website_clicks      BIGINT,
  ADD COLUMN IF NOT EXISTS phone_call_clicks   BIGINT,
  ADD COLUMN IF NOT EXISTS email_contacts      BIGINT,
  ADD COLUMN IF NOT EXISTS total_interactions  BIGINT,
  ADD COLUMN IF NOT EXISTS raw_payload         JSONB;

-- ── 2. Add sync_error to instagram_connections (if missing) ───────────
ALTER TABLE instagram_connections
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- ── 3. Create instagram_media_daily_stats ─────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_media_daily_stats (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT        NOT NULL,
  media_id           TEXT        NOT NULL,
  snapshot_date      DATE        NOT NULL,
  like_count         BIGINT      DEFAULT 0,
  comments_count     BIGINT      DEFAULT 0,
  reach              BIGINT      DEFAULT 0,
  impressions        BIGINT      DEFAULT 0,
  views              BIGINT      DEFAULT 0,
  total_interactions BIGINT      DEFAULT 0,
  raw_payload        JSONB,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, snapshot_date)
);

ALTER TABLE instagram_media_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_media_daily"
  ON instagram_media_daily_stats FOR SELECT TO anon USING (true);
CREATE POLICY "service_media_daily_all"
  ON instagram_media_daily_stats FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ig_media_daily_user
  ON instagram_media_daily_stats (user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ig_media_daily_media
  ON instagram_media_daily_stats (media_id, snapshot_date DESC);
