-- ── Forum Tables ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_posts (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  body       TEXT,
  video_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT      NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL,
  author_name TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_reactions (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    TEXT   NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE forum_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

-- Posts
CREATE POLICY "anon_read_forum_posts"  ON forum_posts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_forum_posts" ON forum_posts FOR ALL    TO anon USING (true) WITH CHECK (true);

-- Comments
CREATE POLICY "anon_read_forum_comments"  ON forum_comments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_forum_comments" ON forum_comments FOR ALL    TO anon USING (true) WITH CHECK (true);

-- Reactions
CREATE POLICY "anon_read_forum_reactions"  ON forum_reactions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_forum_reactions" ON forum_reactions FOR ALL    TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created    ON forum_posts    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post    ON forum_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_post   ON forum_reactions(post_id);
