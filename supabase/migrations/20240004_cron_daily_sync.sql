-- ── Daily Auto-Sync via pg_cron + pg_net ─────────────────────────────
--
-- KURULUM:
-- 1. Dashboard → Database → Extensions → "pg_cron" ve "pg_net" → Enable
-- 2. Aşağıdaki SQL'de iki yeri kendi değerlerinle değiştir:
--      SUPABASE_URL_BURAYA   → örn: https://abcxyz.supabase.co
--      SERVICE_KEY_BURAYA    → Dashboard → Settings → API → service_role key
-- 3. Çalıştır.
-- ─────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Wrapper fonksiyon (değerleri buraya göm)
CREATE OR REPLACE FUNCTION _trigger_daily_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'SUPABASE_URL_BURAYA/functions/v1/instagram-sync-all',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer SERVICE_KEY_BURAYA'
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- Varsa eski job'ı kaldır
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-instagram-sync') THEN
    PERFORM cron.unschedule('daily-instagram-sync');
  END IF;
END $$;

-- Her gün saat 06:00 UTC (Türkiye = 09:00)
SELECT cron.schedule(
  'daily-instagram-sync',
  '0 6 * * *',
  'SELECT _trigger_daily_sync()'
);
