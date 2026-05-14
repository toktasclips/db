-- ============================================================
-- V2 RLS + AUTH GÜVENLİK MİGRASYONU — SAFE VERSION
-- Dijital Barista — Supabase Row Level Security
-- Tüm ALTER/POLICY işlemleri IF EXISTS ile korunmuştur.
-- Var olmayan tablo için hata fırlatmaz, sessizce atlar.
-- ============================================================

-- ============================================================
-- BÖLÜM 1: HELPER FONKSİYONLAR
-- ============================================================

CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'email', '');
$$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'user_role', '');
$$;

-- ============================================================
-- BÖLÜM 2: PROFILES TABLOSU
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client', 'coach')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mevcut users verisini profiles'a kopyala (varsa)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='users') THEN
    INSERT INTO public.profiles (email, full_name, role)
    SELECT email, name, COALESCE(role, 'client')
    FROM public.users
    ON CONFLICT (email) DO NOTHING;
  END IF;
END$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_service_all" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- BÖLÜM 3: RLS AKTİF ET — GÜVENLİ YARDIMCI FONKSİYON
-- ============================================================

-- Her tablo için: var mı kontrol et, RLS aç, policy ekle
CREATE OR REPLACE FUNCTION public._rls_enable_anon(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename=tbl) THEN
    RAISE NOTICE 'Tablo yok, atlandı: %', tbl;
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

  -- Önceki policy'leri temizle
  EXECUTE format('DROP POLICY IF EXISTS "%s_anon_all" ON public.%I', tbl, tbl);
  EXECUTE format('DROP POLICY IF EXISTS "%s_service_all" ON public.%I', tbl, tbl);

  -- Anon: tam erişim (mevcut sistemi korur)
  EXECUTE format(
    'CREATE POLICY "%s_anon_all" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
    tbl, tbl
  );
  -- Service role: tam erişim
  EXECUTE format(
    'CREATE POLICY "%s_service_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
    tbl, tbl
  );

  RAISE NOTICE 'RLS aktif + policy eklendi: %', tbl;
END$$;

-- ============================================================
-- BÖLÜM 4: TÜM TABLOLARA RLS UYGULA
-- ============================================================

-- Kullanıcı verisi tabloları
SELECT public._rls_enable_anon('clients');
SELECT public._rls_enable_anon('leads');
SELECT public._rls_enable_anon('goals');
SELECT public._rls_enable_anon('milestones');
SELECT public._rls_enable_anon('daily_entries');
SELECT public._rls_enable_anon('offers');
SELECT public._rls_enable_anon('kanban_cards');
SELECT public._rls_enable_anon('competitors');
SELECT public._rls_enable_anon('sales');
SELECT public._rls_enable_anon('homework_assignments');
SELECT public._rls_enable_anon('client_teklif');
SELECT public._rls_enable_anon('user_journey_stories');
SELECT public._rls_enable_anon('user_achievements');
SELECT public._rls_enable_anon('messages');
SELECT public._rls_enable_anon('customers');
SELECT public._rls_enable_anon('onboarding_leads');

-- Eğitim tabloları
SELECT public._rls_enable_anon('training_lessons');
SELECT public._rls_enable_anon('training_modules');
SELECT public._rls_enable_anon('training_topics');
SELECT public._rls_enable_anon('training_control_questions');
SELECT public._rls_enable_anon('training_lesson_progress');
SELECT public._rls_enable_anon('training_progress');
SELECT public._rls_enable_anon('training_module_submissions');
SELECT public._rls_enable_anon('program_phases');
SELECT public._rls_enable_anon('program_tasks');
SELECT public._rls_enable_anon('program_task_progress');
SELECT public._rls_enable_anon('user_module_access');

-- Forum tabloları
SELECT public._rls_enable_anon('forum_posts');
SELECT public._rls_enable_anon('forum_comments');
SELECT public._rls_enable_anon('forum_reactions');

-- Instagram / Meta tabloları
SELECT public._rls_enable_anon('instagram_connections');
SELECT public._rls_enable_anon('instagram_account_snapshots');
SELECT public._rls_enable_anon('instagram_media');
SELECT public._rls_enable_anon('meta_ad_insights');

-- ============================================================
-- BÖLÜM 5: CHATBOT TABLOLARI (özel policy'ler)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='chatbots') THEN
    ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chatbots_anon_select" ON public.chatbots;
    DROP POLICY IF EXISTS "chatbots_anon_write" ON public.chatbots;
    DROP POLICY IF EXISTS "chatbots_service_all" ON public.chatbots;
    -- Aktif botları herkes görebilir
    CREATE POLICY "chatbots_anon_select" ON public.chatbots
      FOR SELECT TO anon USING (is_active = true OR is_active IS NULL);
    -- Admin (anon key ile) yönetebilir — geçici
    CREATE POLICY "chatbots_anon_write" ON public.chatbots
      FOR ALL TO anon USING (true) WITH CHECK (true);
    CREATE POLICY "chatbots_service_all" ON public.chatbots
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'chatbots RLS aktif';
  ELSE
    RAISE NOTICE 'chatbots tablosu yok, atlandı';
  END IF;
END$$;

SELECT public._rls_enable_anon('chatbot_conversations');
SELECT public._rls_enable_anon('chatbot_messages');

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='chatbot_documents') THEN
    ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chatbot_docs_anon" ON public.chatbot_documents;
    DROP POLICY IF EXISTS "chatbot_docs_service" ON public.chatbot_documents;
    CREATE POLICY "chatbot_docs_anon" ON public.chatbot_documents
      FOR ALL TO anon USING (true) WITH CHECK (true);
    CREATE POLICY "chatbot_docs_service" ON public.chatbot_documents
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'chatbot_documents RLS aktif';
  ELSE
    RAISE NOTICE 'chatbot_documents tablosu yok, atlandı';
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='chatbot_chunks') THEN
    ALTER TABLE public.chatbot_chunks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chatbot_chunks_service" ON public.chatbot_chunks;
    -- Chunks sadece Edge Function (service_role) okur/yazar
    CREATE POLICY "chatbot_chunks_service" ON public.chatbot_chunks
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'chatbot_chunks RLS aktif (sadece service_role)';
  ELSE
    RAISE NOTICE 'chatbot_chunks tablosu yok, atlandı';
  END IF;
END$$;

-- ============================================================
-- BÖLÜM 6: USERS TABLOSU
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "users_anon_select" ON public.users;
    DROP POLICY IF EXISTS "users_anon_insert" ON public.users;
    DROP POLICY IF EXISTS "users_anon_update" ON public.users;
    DROP POLICY IF EXISTS "users_service_all" ON public.users;
    -- Login için SELECT gerekli
    CREATE POLICY "users_anon_select" ON public.users FOR SELECT TO anon USING (true);
    CREATE POLICY "users_anon_insert" ON public.users FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "users_anon_update" ON public.users FOR UPDATE TO anon USING (true) WITH CHECK (true);
    CREATE POLICY "users_service_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'users RLS aktif';
  ELSE
    RAISE NOTICE 'users tablosu yok, atlandı';
  END IF;
END$$;

-- ============================================================
-- BÖLÜM 7: YARDIMCI FONKSİYONU TEMİZLE
-- ============================================================

DROP FUNCTION IF EXISTS public._rls_enable_anon(text);

-- ============================================================
-- BÖLÜM 8: DOĞRULAMA — Hangi tablolar RLS'li?
-- ============================================================

SELECT
  tablename,
  rowsecurity AS rls_aktif,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public') AS policy_sayisi
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
