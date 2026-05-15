-- ============================================================
-- V2.2 — POLICY POLISH
-- onboarding_leads admin_all (USING true) kaldırıldı,
-- is_admin() kontrolüyle daraltıldı.
-- v3_5_anon_cleanup.sql çalıştırılmış olmalı.
-- ============================================================

-- ============================================================
-- 1. ONBOARDING_LEADS — POLICY TEMİZLE VE YENİDEN KUR
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

  -- Potansiyel geniş "admin_all" policy'i kaldır
  DROP POLICY IF EXISTS "admin_all"                     ON public.onboarding_leads;
  -- Önceki genel auth_own kaldır
  DROP POLICY IF EXISTS "onboarding_leads_auth_own"     ON public.onboarding_leads;
  -- Önceki granüler policy'leri temizle (tekrar oluşturulacak)
  DROP POLICY IF EXISTS "onboarding_leads_admin_select" ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_admin_update" ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_admin_delete" ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_anon_insert"  ON public.onboarding_leads;

  -- Anon: sadece INSERT (public onboarding formu için gerekli)
  CREATE POLICY "onboarding_leads_anon_insert" ON public.onboarding_leads
    FOR INSERT TO anon
    WITH CHECK (true);

  -- Admin: SELECT
  CREATE POLICY "onboarding_leads_admin_select" ON public.onboarding_leads
    FOR SELECT TO authenticated
    USING (public.is_admin());

  -- Admin: UPDATE (onboarding onaylama/arşivleme)
  CREATE POLICY "onboarding_leads_admin_update" ON public.onboarding_leads
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  -- Admin: DELETE
  CREATE POLICY "onboarding_leads_admin_delete" ON public.onboarding_leads
    FOR DELETE TO authenticated
    USING (public.is_admin());

  RAISE NOTICE 'onboarding_leads: admin_all kaldırıldı, is_admin() policy oluşturuldu';
END$$;

-- ============================================================
-- 2. DOĞRULAMA — onboarding_leads policy listesi
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

-- Beklenen çıktı:
--   onboarding_leads_admin_delete  | DELETE | {authenticated} | is_admin()
--   onboarding_leads_admin_select  | SELECT | {authenticated} | is_admin()
--   onboarding_leads_admin_update  | UPDATE | {authenticated} | is_admin()
--   onboarding_leads_anon_insert   | INSERT | {anon}          | true
