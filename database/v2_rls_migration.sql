-- ============================================================
-- V2 RLS MİGRASYONU — TEK BLOK VERSİYON
-- Supabase SQL Editor'da tek seferde çalışır.
-- Var olmayan tablolar sessizce atlanır.
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'client'
                 CHECK (role IN ('admin','client','coach')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all"  ON public.profiles;

CREATE POLICY "profiles_anon_select" ON public.profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users verisini profiles'a kopyala (conflict varsa atla)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables
             WHERE schemaname='public' AND tablename='users') THEN
    INSERT INTO public.profiles (email, full_name, role)
    SELECT email,
           COALESCE(name, email),
           COALESCE(role, 'client')
    FROM public.users
    ON CONFLICT (email) DO NOTHING;
  END IF;
END$$;

-- ============================================================
-- 2. TÜM TABLOLARA RLS — TEK BÜYÜK DO BLOĞU
-- ============================================================
DO $$
DECLARE
  tbl text;
  -- Standart tablolar: anon tam erişim + service_role tam erişim
  standard_tables text[] := ARRAY[
    'clients','leads','goals','milestones','daily_entries',
    'offers','kanban_cards','competitors','sales',
    'homework_assignments','client_teklif','user_journey_stories',
    'user_achievements','messages','customers','onboarding_leads',
    'training_lessons','training_modules','training_topics',
    'training_control_questions','training_lesson_progress',
    'training_progress','training_module_submissions',
    'program_phases','program_tasks','program_task_progress',
    'user_module_access','forum_posts','forum_comments',
    'forum_reactions','instagram_connections',
    'instagram_account_snapshots','instagram_media',
    'meta_ad_insights','chatbot_conversations','chatbot_messages',
    'chatbot_documents','chatbot_chunks'
  ];
BEGIN
  FOREACH tbl IN ARRAY standard_tables LOOP
    -- Tablo var mı?
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    -- RLS aç
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl
    );

    -- Eski policy'leri temizle
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_anon_all" ON public.%I', tbl, tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_all" ON public.%I', tbl, tbl
    );

    -- Anon: tam erişim (mevcut app bozulmasın)
    EXECUTE format(
      'CREATE POLICY "%s_anon_all" ON public.%I
         FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );

    -- Service role: tam erişim
    EXECUTE format(
      'CREATE POLICY "%s_service_all" ON public.%I
         FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl, tbl
    );

    RAISE NOTICE 'RLS aktif: %', tbl;
  END LOOP;
END$$;

-- ============================================================
-- 3. USERS TABLOSU (ayrı — login bozulmasın)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname='public' AND tablename='users'
  ) THEN
    RAISE NOTICE 'users tablosu yok, atlandı';
    RETURN;
  END IF;

  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "users_anon_select" ON public.users;
  DROP POLICY IF EXISTS "users_anon_insert" ON public.users;
  DROP POLICY IF EXISTS "users_anon_update" ON public.users;
  DROP POLICY IF EXISTS "users_service_all"  ON public.users;

  -- Login için SELECT şart
  CREATE POLICY "users_anon_select" ON public.users
    FOR SELECT TO anon USING (true);

  CREATE POLICY "users_anon_insert" ON public.users
    FOR INSERT TO anon WITH CHECK (true);

  CREATE POLICY "users_anon_update" ON public.users
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

  CREATE POLICY "users_service_all" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

  RAISE NOTICE 'users RLS aktif';
END$$;

-- ============================================================
-- 4. CHATBOTS (is_active filtresi)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname='public' AND tablename='chatbots'
  ) THEN
    RAISE NOTICE 'chatbots tablosu yok, atlandı';
    RETURN;
  END IF;

  ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "chatbots_anon_select" ON public.chatbots;
  DROP POLICY IF EXISTS "chatbots_anon_write"  ON public.chatbots;
  DROP POLICY IF EXISTS "chatbots_service_all" ON public.chatbots;

  -- Aktif botları herkes görebilir
  CREATE POLICY "chatbots_anon_select" ON public.chatbots
    FOR SELECT TO anon
    USING (is_active = true OR is_active IS NULL);

  -- Admin (anon key) yönetebilir — geçici
  CREATE POLICY "chatbots_anon_write" ON public.chatbots
    FOR ALL TO anon USING (true) WITH CHECK (true);

  CREATE POLICY "chatbots_service_all" ON public.chatbots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

  RAISE NOTICE 'chatbots RLS aktif';
END$$;

-- ============================================================
-- 5. HELPER FONKSİYONLAR (V3 geçişi için)
-- ============================================================
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'email', ''
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'user_role', ''
  );
$$;

-- ============================================================
-- 6. DOĞRULAMA
-- ============================================================
SELECT
  tablename,
  rowsecurity          AS rls_aktif,
  (SELECT COUNT(*)
   FROM pg_policies p
   WHERE p.tablename  = t.tablename
     AND p.schemaname = 'public') AS policy_sayisi
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
