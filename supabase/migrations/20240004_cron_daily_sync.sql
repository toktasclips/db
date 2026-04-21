-- ── Daily Auto-Sync via pg_cron + pg_net ─────────────────────────────
--
-- KURULUM (bir kez yap):
-- 1. Dashboard → Database → Extensions → "pg_cron" ve "pg_net" → Enable
-- 2. Aşağıdaki iki ALTER satırını kendi değerlerinle çalıştır:
--
--   ALTER DATABASE postgres SET app.supabase_url    = 'https://XXXX.supabase.co';
--   ALTER DATABASE postgres SET app.service_role_key = 'eyJ...service_role_key...';
--
-- 3. Bu migration'ı çalıştır.
-- ─────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Varsa eski job'ı kaldır
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-instagram-sync') THEN
    PERFORM cron.unschedule('daily-instagram-sync');
  END IF;
END $$;

-- Her gün saat 06:00 UTC (Türkiye = 09:00) otomatik sync
SELECT cron.schedule(
  'daily-instagram-sync',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/instagram-sync-all',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
