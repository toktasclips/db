-- ============================================================
-- V2.2b — ONBOARDING_LEADS PUBLIC POLICY TEMİZLİĞİ
-- onboarding_leads_all (public, USING true) kaldır.
-- v2_2_policy_polish.sql'den sonra çalıştır.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'onboarding_leads'
  ) THEN
    RAISE NOTICE 'onboarding_leads tablosu yok, atlandı';
    RETURN;
  END IF;

  -- Tüm public/herkese açık onboarding policy'lerini kaldır
  DROP POLICY IF EXISTS "onboarding_leads_all"         ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_public_all"  ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_auth_all"    ON public.onboarding_leads;

  RAISE NOTICE 'onboarding_leads_all (public, USING true) kaldırıldı';
END$$;

-- ============================================================
-- Doğrulama
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_clause,
  with_check AS check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'onboarding_leads'
ORDER BY policyname;

-- Beklenen çıktı (5 satır DEĞİL 4 satır):
--   onboarding_leads_admin_delete  | DELETE | {authenticated} | is_admin()
--   onboarding_leads_admin_select  | SELECT | {authenticated} | is_admin()
--   onboarding_leads_admin_update  | UPDATE | {authenticated} | is_admin()
--   onboarding_leads_anon_insert   | INSERT | {anon}          | true
--   onboarding_leads_service_all   | ALL    | {service_role}  | true   ← OK
--
-- onboarding_leads_all ({public}, USING true) OLMAMALI
