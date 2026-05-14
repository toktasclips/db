-- ============================================================
-- V3 AUTH MİGRASYONU
-- Supabase Auth'a geçiş + kullanıcı izolasyonu
-- Supabase SQL Editor'da tek seferde çalıştır.
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLOSU — AUTH.UID() İLE EŞLEŞTİR
-- ============================================================

-- profiles'ı id = auth.uid() olacak şekilde güncelle
-- Mevcut kayıtlar auth_user_id ile zaten bağlı olacak (trigger aşağıda)

-- ============================================================
-- 2. AUTH TRIGGER — Yeni Supabase Auth kullanıcısı oluşunca
--    profiles tablosuna otomatik kayıt ekle
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aynı email'e sahip profile varsa auth_user_id'yi bağla
  UPDATE public.profiles
  SET auth_user_id = NEW.id
  WHERE email = NEW.email AND auth_user_id IS NULL;

  -- Yoksa yeni profile oluştur
  IF NOT FOUND THEN
    INSERT INTO public.profiles (auth_user_id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Mevcut auth.users kayıtlarını profiles ile eşleştir
-- (Daha önce auth'a eklenen kullanıcılar için)
UPDATE public.profiles p
SET auth_user_id = au.id
FROM auth.users au
WHERE p.email = au.email
  AND p.auth_user_id IS NULL;

-- ============================================================
-- 3. YARDIMCI FONKSİYONLAR
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
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ============================================================
-- 4. PROFILES RLS — AUTHENTICATED KULLANICILARA AÇIK
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_anon_select"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_auth_read_own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_auth_update_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_auth_admin_all"      ON public.profiles;

-- Anon: sadece okuma (geçiş dönemi için)
CREATE POLICY "profiles_anon_select" ON public.profiles
  FOR SELECT TO anon USING (true);

-- Authenticated: kendi profilini oku
CREATE POLICY "profiles_auth_read_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin());

-- Authenticated: kendi profilini güncelle (role değiştiremez)
CREATE POLICY "profiles_auth_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Admin: tam erişim
CREATE POLICY "profiles_auth_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role: tam erişim
CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. KULLANICI VERİSİ TABLOLARI — authenticated İZOLASYONU
--    user_id = email (V3'te değişmiyor, geçiş güvenli)
-- ============================================================
DO $$
DECLARE
  tbl text;
  user_tables text[] := ARRAY[
    'clients','leads','goals','milestones','daily_entries',
    'offers','kanban_cards','competitors','sales',
    'homework_assignments','client_teklif','user_journey_stories',
    'user_achievements','messages','customers','onboarding_leads',
    'instagram_connections','instagram_account_snapshots','instagram_media',
    'instagram_media_daily_stats','meta_ad_insights',
    'chatbot_conversations','chatbot_messages',
    'training_progress','training_module_submissions',
    'program_phases','program_tasks','program_task_progress',
    'user_module_access','forum_posts','forum_comments','forum_reactions',
    'contents','events','tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY user_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    -- Eski authenticated policy'leri temizle
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_auth_own" ON public.%I', tbl, tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_auth_admin" ON public.%I', tbl, tbl
    );

    -- Authenticated: kendi verisini tam yönet (user_id = email)
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

    RAISE NOTICE 'authenticated policy eklendi: %', tbl;
  END LOOP;
END$$;

-- ============================================================
-- 6. PAYLAŞILAN İÇERİK TABLOLARI — Tüm giriş yapmış kullanıcılar
--    (Eğitim içeriği, chatbot tanımları vb.)
-- ============================================================
DO $$
DECLARE
  tbl text;
  shared_tables text[] := ARRAY[
    'training_lessons','training_modules','training_topics',
    'training_control_questions','training_lesson_progress',
    'chatbots','chatbot_documents','chatbot_chunks',
    'program_weeks','toolbox_items','conversation_starters',
    'cls_lessons','cls_modules','cls_programs','cls_levels',
    'cls_lesson_resources','cls_lesson_progress','cls_user_level_access',
    'onboarding_registrations'
  ];
BEGIN
  FOREACH tbl IN ARRAY shared_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_auth_read" ON public.%I', tbl, tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_auth_admin_write" ON public.%I', tbl, tbl
    );

    -- Authenticated: okuma (tüm kullanıcılar)
    EXECUTE format(
      'CREATE POLICY "%s_auth_read" ON public.%I
         FOR SELECT TO authenticated
         USING (true)',
      tbl, tbl
    );

    -- Authenticated: yazma sadece admin
    EXECUTE format(
      'CREATE POLICY "%s_auth_admin_write" ON public.%I
         FOR ALL TO authenticated
         USING (public.is_admin())
         WITH CHECK (public.is_admin())',
      tbl, tbl
    );

    RAISE NOTICE 'shared authenticated policy eklendi: %', tbl;
  END LOOP;
END$$;

-- ============================================================
-- 7. USERS TABLOSU — Geçiş modu (login için artık kullanılmıyor)
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

  -- Eski policy'leri temizle
  DROP POLICY IF EXISTS "users_auth_read"      ON public.users;
  DROP POLICY IF EXISTS "users_auth_admin_all" ON public.users;

  -- Authenticated: sadece admin tüm kullanıcıları görebilir
  CREATE POLICY "users_auth_read" ON public.users
    FOR SELECT TO authenticated
    USING (public.is_admin() OR email = (auth.jwt() ->> 'email'));

  -- Admin: tam erişim
  CREATE POLICY "users_auth_admin_all" ON public.users
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  RAISE NOTICE 'users authenticated policies eklendi';
END$$;

-- ============================================================
-- 8. CHATBOT GÜVENLİĞİ — chatbot_documents/chunks gizli kalmalı
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents'
  ) THEN
    RAISE NOTICE 'chatbot_documents yok, atlandı';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "chatbot_documents_auth_admin" ON public.chatbot_documents;

  -- Chatbot belgelerine sadece admin erişebilir (authenticated)
  CREATE POLICY "chatbot_documents_auth_admin" ON public.chatbot_documents
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  RAISE NOTICE 'chatbot_documents admin-only policy eklendi';
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'chatbot_chunks'
  ) THEN
    RAISE NOTICE 'chatbot_chunks yok, atlandı';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "chatbot_chunks_auth_admin" ON public.chatbot_chunks;

  CREATE POLICY "chatbot_chunks_auth_admin" ON public.chatbot_chunks
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  RAISE NOTICE 'chatbot_chunks admin-only policy eklendi';
END$$;

-- ============================================================
-- 9. DOĞRULAMA
-- ============================================================
SELECT
  tablename,
  rowsecurity AS rls_aktif,
  (SELECT COUNT(*)
   FROM pg_policies p
   WHERE p.tablename  = t.tablename
     AND p.schemaname = 'public') AS policy_sayisi
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
