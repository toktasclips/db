-- ============================================================
-- V3.6 — ADMİN BYPASS FİX
-- Admin tüm verileri görebilsin, normal kullanıcı izolasyonu korunsun.
-- Supabase SQL Editor'da çalıştır.
-- ÖNEMLİ: v3_auth_migration.sql çalıştırılmış olmalı.
-- ============================================================

-- ============================================================
-- 1. is_admin() FONKSİYONU — EMAIL FALLBACK EKLENDİ
--    auth_user_id bağlı olmasa bile email eşleşmesiyle admin bypass çalışır
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (
      auth_user_id = auth.uid()
      OR email = (auth.jwt() ->> 'email')
    )
    AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. ADMİN PROFİL LİNKAJI — auth_user_id BOŞSA DOLDUR
--    Eğer admin profili auth.users ile bağlanmamışsa bağla
-- ============================================================
UPDATE public.profiles p
SET auth_user_id = au.id
FROM auth.users au
WHERE p.email = au.email
  AND p.auth_user_id IS NULL;

-- Bağlanmayan profil varsa raporla
SELECT email, role, auth_user_id IS NULL AS unlinked
FROM public.profiles
WHERE role = 'admin';

-- ============================================================
-- 3. KRİTİK TABLOLAR — POLICY AUDIT VE FIX
--    user_id text tipli tablolarda admin bypass kontrol et
-- ============================================================
DO $$
DECLARE
  tbl text;
  critical_tables text[] := ARRAY[
    'clients','leads','goals','milestones','daily_entries',
    'offers','kanban_cards','competitors','sales',
    'homework_assignments','client_teklif','user_journey_stories',
    'user_achievements','messages','customers',
    'instagram_connections','instagram_account_snapshots','instagram_media',
    'instagram_media_daily_stats','meta_ad_insights',
    'chatbot_conversations','chatbot_messages',
    'training_progress','training_module_submissions',
    'program_phases','program_tasks','program_task_progress',
    'user_module_access','forum_posts','forum_comments','forum_reactions',
    'contents','events','tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY critical_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    -- user_id kolonu var mı?
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE 'user_id yok — atlandı: %', tbl;
      CONTINUE;
    END IF;

    -- Mevcut policy'i kaldır ve yeniden oluştur
    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_own" ON public.%I', tbl, tbl);

    -- UUID tipli user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl
        AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "%s_auth_own" ON public.%I
           FOR ALL TO authenticated
           USING (user_id = auth.uid() OR public.is_admin())
           WITH CHECK (user_id = auth.uid() OR public.is_admin())',
        tbl, tbl
      );
      RAISE NOTICE 'UUID user_id policy yenilendi: %', tbl;
    ELSE
      -- TEXT tipli user_id (email bazlı eski kayıtlar destekleniyor)
      EXECUTE format(
        'CREATE POLICY "%s_auth_own" ON public.%I
           FOR ALL TO authenticated
           USING (
             user_id = (auth.jwt() ->> ''email'')
             OR public.is_admin()
           )
           WITH CHECK (
             user_id = (auth.jwt() ->> ''email'')
             OR public.is_admin()
           )',
        tbl, tbl
      );
      RAISE NOTICE 'TEXT user_id policy yenilendi: %', tbl;
    END IF;
  END LOOP;
END$$;

-- ============================================================
-- 4. PROFILES — ADMİN TAM ERİŞİM POLICY KONTROL
-- ============================================================
DROP POLICY IF EXISTS "profiles_auth_admin_all" ON public.profiles;
CREATE POLICY "profiles_auth_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 5. DOĞRULAMA — Admin profil durumu
-- ============================================================
SELECT
  p.email,
  p.role,
  p.auth_user_id,
  au.id AS auth_id,
  CASE WHEN p.auth_user_id = au.id THEN 'BAĞLI ✓' ELSE 'BAĞLI DEĞİL ✗' END AS durum
FROM public.profiles p
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.role = 'admin'
ORDER BY p.email;

-- ============================================================
-- 6. DOĞRULAMA — Tüm tablolarda policy sayısı
-- ============================================================
SELECT
  tablename,
  COUNT(*) AS policy_sayisi,
  bool_or('anon' = ANY(roles)) AS anon_erişim_var,
  bool_or('authenticated' = ANY(roles)) AS auth_erişim_var
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
