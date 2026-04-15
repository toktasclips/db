-- ============================================================
-- Instagram Integration — Database Migration
-- ============================================================

-- 1. pgcrypto for symmetric token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Encryption helpers (service_role only)
CREATE OR REPLACE FUNCTION encrypt_ig_token(plain_token text, secret_key text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT encode(pgp_sym_encrypt(plain_token, secret_key)::bytea, 'base64');
$$;

CREATE OR REPLACE FUNCTION decrypt_ig_token(encrypted_token text, secret_key text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT pgp_sym_decrypt(decode(encrypted_token, 'base64')::bytea, secret_key);
$$;

REVOKE ALL ON FUNCTION encrypt_ig_token(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION decrypt_ig_token(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION encrypt_ig_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_ig_token(text, text) TO service_role;

-- ============================================================
-- 3. instagram_connections — stores bağlantı + encrypted token
-- ============================================================
CREATE TABLE IF NOT EXISTS instagram_connections (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               text        NOT NULL,
  instagram_user_id     text        NOT NULL,
  instagram_username    text,
  instagram_account_name text,
  encrypted_access_token text       NOT NULL,   -- pgp_sym_encrypt; anon cannot read
  page_id               text,                   -- FB Page ID (needed for IG Graph API)
  token_expires_at      timestamptz,
  is_active             boolean     DEFAULT true,
  last_synced_at        timestamptz,
  sync_error            text,                   -- last sync error message (masked)
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT uq_ig_connection UNIQUE (user_id, instagram_user_id)
);

-- Anon may read metadata (username, last_synced_at…) but NEVER the token column
ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_ig_conn_meta" ON instagram_connections
  FOR SELECT TO anon USING (true);

-- Revoke token column from anon role at column level
REVOKE SELECT (encrypted_access_token) ON instagram_connections FROM anon;

-- Service role (Edge Functions) can do everything
CREATE POLICY "service_ig_conn_all" ON instagram_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 4. instagram_account_snapshots — daily account metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS instagram_account_snapshots (
  id                 uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            text    NOT NULL,
  instagram_user_id  text    NOT NULL,
  snapshot_date      date    NOT NULL,
  follower_count     bigint  DEFAULT 0,
  follows_count      bigint  DEFAULT 0,
  media_count        bigint  DEFAULT 0,
  reach              bigint  DEFAULT 0,
  impressions        bigint  DEFAULT 0,
  profile_views      bigint  DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  CONSTRAINT uq_ig_snapshot UNIQUE (user_id, instagram_user_id, snapshot_date)
);

ALTER TABLE instagram_account_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_ig_snapshots" ON instagram_account_snapshots
  FOR SELECT TO anon USING (true);

CREATE POLICY "service_ig_snapshots_all" ON instagram_account_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. instagram_media — per-post performance data
-- ============================================================
CREATE TABLE IF NOT EXISTS instagram_media (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            text        NOT NULL,
  instagram_user_id  text        NOT NULL,
  media_id           text        NOT NULL,
  media_type         text,                      -- IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
  caption            text,
  thumbnail_url      text,
  media_url          text,
  permalink          text,
  published_at       timestamptz,
  like_count         bigint      DEFAULT 0,
  comments_count     bigint      DEFAULT 0,
  views              bigint      DEFAULT 0,
  reach              bigint      DEFAULT 0,
  saves              bigint      DEFAULT 0,
  shares             bigint      DEFAULT 0,
  engagement_rate    numeric(8,4) DEFAULT 0,
  performance_score  numeric(8,2) DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  CONSTRAINT uq_ig_media UNIQUE (media_id)
);

ALTER TABLE instagram_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_ig_media" ON instagram_media
  FOR SELECT TO anon USING (true);

CREATE POLICY "service_ig_media_all" ON instagram_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ig_snapshots_user_date  ON instagram_account_snapshots (user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ig_media_user_published  ON instagram_media (user_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_conn_user_active      ON instagram_connections (user_id, is_active);

-- ============================================================
-- 7. pg_cron daily sync (run AFTER enabling pg_cron extension in Supabase dashboard)
-- Uncomment and update YOUR_SERVICE_ROLE_KEY / YOUR_SUPABASE_URL before running
-- ============================================================
/*
SELECT cron.schedule(
  'instagram-daily-sync',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url        := 'https://krljaqrhyszeleiwwkmd.supabase.co/functions/v1/instagram-sync-all',
    headers    := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body       := '{}'::jsonb
  );
  $$
);
*/
