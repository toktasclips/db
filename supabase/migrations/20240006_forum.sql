-- ── Forum Posts Table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_posts (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  body       TEXT,
  video_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- All users can read; writes are admin-only at the app level
CREATE POLICY "anon_read_forum"    ON forum_posts FOR SELECT TO anon    USING (true);
CREATE POLICY "anon_write_forum"   ON forum_posts FOR ALL    TO anon    USING (true) WITH CHECK (true);
CREATE POLICY "service_forum_all"  ON forum_posts FOR ALL    TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts (created_at DESC);
