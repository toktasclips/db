-- ============================================================
-- V3.5 — ANON POLİCY TEMİZLİĞİ
-- Tüm anon policy'leri kaldır, sadece onboarding_leads INSERT kalır.
-- Supabase SQL Editor'da çalıştır.
-- ÖNEMLİ: Önce v3_auth_migration.sql çalıştırılmış olmalı.
-- ============================================================

-- ============================================================
-- 1. TÜM ANON POLICY'LERİ KALDIR
--    (onboarding_leads INSERT hariç)
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'anon' = ANY(roles)
      -- onboarding_leads anon INSERT politikasını koru
      AND NOT (tablename = 'onboarding_leads' AND cmd = 'INSERT')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      pol.policyname, pol.tablename
    );
    RAISE NOTICE 'Silindi: % üzerinde %', pol.tablename, pol.policyname;
  END LOOP;
END$$;

-- ============================================================
-- 2. ONBOARDING_LEADS — SADECE ANON INSERT (Public form için)
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

  DROP POLICY IF EXISTS "onboarding_leads_anon_insert" ON public.onboarding_leads;
  DROP POLICY IF EXISTS "onboarding_leads_anon_all"    ON public.onboarding_leads;

  -- Yalnızca INSERT — anonim kullanıcılar form doldurup kaydedebilir
  CREATE POLICY "onboarding_leads_anon_insert" ON public.onboarding_leads
    FOR INSERT TO anon
    WITH CHECK (true);

  RAISE NOTICE 'onboarding_leads: sadece anon INSERT policy bırakıldı';
END$$;

-- ============================================================
-- 3. PROFILES — ANON SELECT KALDIRMAK YERİNE KISITLA
--    (Sadece kendi profili görebilir, anon erişim yok)
-- ============================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;
  RAISE NOTICE 'profiles: anon_select kaldırıldı';
END$$;

-- ============================================================
-- 4. USERS TABLOSU — LEGACY MODA AL
--    Sadece service_role ve admin authenticated erişebilir
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN
    RAISE NOTICE 'users tablosu yok, atlandı';
    RETURN;
  END IF;

  -- Tüm mevcut policy'leri kaldır
  DROP POLICY IF EXISTS "users_anon_select"    ON public.users;
  DROP POLICY IF EXISTS "users_anon_insert"    ON public.users;
  DROP POLICY IF EXISTS "users_anon_update"    ON public.users;
  DROP POLICY IF EXISTS "users_anon_all"       ON public.users;
  DROP POLICY IF EXISTS "users_auth_read"      ON public.users;
  DROP POLICY IF EXISTS "users_auth_admin_all" ON public.users;
  DROP POLICY IF EXISTS "users_service_all"    ON public.users;

  -- Authenticated admin: okuma (legacy kullanıcı listesi için)
  CREATE POLICY "users_admin_select" ON public.users
    FOR SELECT TO authenticated
    USING (public.is_admin());

  -- Service role: tam erişim (migration araçları için)
  CREATE POLICY "users_service_all" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- Tablo yorumu ekle
  COMMENT ON TABLE public.users IS 'LEGACY TABLE — V3+ için kullanılmıyor. Supabase Auth + profiles tablosu kullanılıyor. V4/V5 sonrası kaldırılacak.';

  RAISE NOTICE 'users: legacy moda alındı (sadece admin okuyabilir)';
END$$;

-- ============================================================
-- 5. CHATBOT_DOCUMENTS / CHATBOT_CHUNKS — ANON ERİŞİMİ KAPAT
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['chatbot_documents','chatbot_chunks'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=tbl
    ) THEN CONTINUE; END IF;

    -- Anon policy'leri tamamen kaldır (verisi hassas)
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_all" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_select" ON public.%I', tbl, tbl);
    RAISE NOTICE '% anon erişimi kapatıldı', tbl;
  END LOOP;
END$$;

-- ============================================================
-- 6. DOĞRULAMA — Kalan anon policy'leri kontrol et
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND 'anon' = ANY(roles)
ORDER BY tablename;

-- Beklenen çıktı: sadece onboarding_leads INSERT olmalı
