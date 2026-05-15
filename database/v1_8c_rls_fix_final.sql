-- ============================================================
-- V1.8c — RLS SELECT İZOLASYONU (DÜZELTİLMİŞ)
-- v1_8'in messages bloğu hata verdi, tüm transaction rollback oldu.
-- Bu dosya messages bloğu olmadan aynı işi yapar.
-- v1_8b zaten çalıştırıldıysa messages policy tamam.
-- ============================================================

-- ============================================================
-- 1. KİŞİSEL VERİ TABLOLARI — USING'den admin bypass kaldır
-- ============================================================
DO $$
DECLARE
  tbl text;
  personal_tables text[] := ARRAY[
    'clients','leads','goals','milestones','daily_entries',
    'offers','kanban_cards','competitors','sales',
    'homework_assignments','client_teklif','user_journey_stories',
    'user_achievements','customers',
    'chatbot_conversations','chatbot_messages',
    'training_progress','training_module_submissions',
    'program_task_progress','user_module_access',
    'instagram_connections','instagram_account_snapshots',
    'instagram_media','instagram_media_daily_stats','meta_ad_insights',
    'contents','events','tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY personal_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE 'user_id yok — atlandı: %', tbl;
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_own" ON public.%I', tbl, tbl);

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl
        AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "%s_auth_own" ON public.%I
           FOR ALL TO authenticated
           USING (user_id = auth.uid())
           WITH CHECK (user_id = auth.uid() OR public.is_admin())',
        tbl, tbl
      );
      RAISE NOTICE 'UUID — admin bypass SELECT''tan kaldırıldı: %', tbl;
    ELSE
      EXECUTE format(
        'CREATE POLICY "%s_auth_own" ON public.%I
           FOR ALL TO authenticated
           USING (user_id = (auth.jwt() ->> ''email''))
           WITH CHECK (
             user_id = (auth.jwt() ->> ''email'')
             OR public.is_admin()
           )',
        tbl, tbl
      );
      RAISE NOTICE 'TEXT — admin bypass SELECT''tan kaldırıldı: %', tbl;
    END IF;
  END LOOP;
END$$;

-- ============================================================
-- 2. FORUM TABLOLARI — Community içerik, herkes okuyabilir
-- ============================================================
DO $$
DECLARE
  tbl text;
  forum_tables text[] := ARRAY['forum_posts','forum_comments','forum_reactions'];
BEGIN
  FOREACH tbl IN ARRAY forum_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN CONTINUE; END IF;

    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_own" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_select" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_write" ON public.%I', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY "%s_auth_select" ON public.%I
         FOR SELECT TO authenticated USING (true)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_auth_write" ON public.%I
         FOR ALL TO authenticated
         USING (user_id = (auth.jwt() ->> ''email'') OR public.is_admin())
         WITH CHECK (user_id = (auth.jwt() ->> ''email'') OR public.is_admin())',
      tbl, tbl
    );
    RAISE NOTICE 'Forum community policy eklendi: %', tbl;
  END LOOP;
END$$;

-- ============================================================
-- 3. INSTAGRAM ANON POLICY TEMİZLİĞİ
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_connections') THEN
    DROP POLICY IF EXISTS "anon_read_ig_conn_meta" ON public.instagram_connections;
    RAISE NOTICE 'instagram_connections: anon SELECT kaldırıldı';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_account_snapshots') THEN
    DROP POLICY IF EXISTS "anon_read_ig_snapshots" ON public.instagram_account_snapshots;
    RAISE NOTICE 'instagram_account_snapshots: anon SELECT kaldırıldı';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_media') THEN
    DROP POLICY IF EXISTS "anon_read_ig_media" ON public.instagram_media;
    RAISE NOTICE 'instagram_media: anon SELECT kaldırıldı';
  END IF;
END$$;

-- ============================================================
-- 4. DOĞRULAMA — Kişisel tablolarda is_admin() kalmamalı
-- ============================================================
SELECT tablename, policyname, qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'clients','leads','daily_entries','goals','milestones',
    'offers','kanban_cards','competitors','sales','customers'
  )
  AND policyname LIKE '%auth_own%'
ORDER BY tablename;
