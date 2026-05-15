-- ============================================================
-- V1.8 — RLS SELECT İZOLASYONU
-- Kişisel veri tablolarından admin bypass (OR is_admin())
-- SELECT (USING) clause'dan kaldırıldı.
-- Her kullanıcı (admin dahil) sadece kendi verisini okuyabilir.
-- INSERT için admin bypass korundu (admin kendi adına veri girebilir).
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
    -- Tablo var mı?
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

    -- Mevcut auth_own policy'i kaldır
    EXECUTE format('DROP POLICY IF EXISTS "%s_auth_own" ON public.%I', tbl, tbl);

    -- UUID tipli user_id mi?
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
      -- TEXT tipli user_id (email bazlı)
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
-- 2. MESSAGES — Admin tüm thread'leri görebilir (mesajlaşma sistemi)
--    SELECT'te admin bypass KORUNUYOR (özel durum)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages'
  ) THEN
    RAISE NOTICE 'messages tablosu yok, atlandı';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "messages_auth_own" ON public.messages;

  CREATE POLICY "messages_auth_own" ON public.messages
    FOR ALL TO authenticated
    USING (
      user_id = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
    WITH CHECK (
      user_id = (auth.jwt() ->> 'email')
      OR public.is_admin()
    );

  RAISE NOTICE 'messages: admin SELECT bypass korundu (mesajlaşma sistemi)';
END$$;

-- ============================================================
-- 3. FORUM TABLOLARI — Community içerik, herkes okuyabilir
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

    -- Tüm authenticated kullanıcılar okuyabilir (forum community içeriği)
    EXECUTE format(
      'CREATE POLICY "%s_auth_select" ON public.%I
         FOR SELECT TO authenticated USING (true)',
      tbl, tbl
    );
    -- Kendi yazısını yazabilir/düzenleyebilir, admin her şeyi
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
-- 4. INSTAGRAM ANON POLICY TEMİZLİĞİ
--    Kişisel IG verileri anon'a açık kalmamalı
-- ============================================================
DO $$
BEGIN
  -- instagram_connections
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_connections') THEN
    DROP POLICY IF EXISTS "anon_read_ig_conn_meta" ON public.instagram_connections;
    RAISE NOTICE 'instagram_connections: anon SELECT kaldırıldı';
  END IF;

  -- instagram_account_snapshots
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_account_snapshots') THEN
    DROP POLICY IF EXISTS "anon_read_ig_snapshots" ON public.instagram_account_snapshots;
    RAISE NOTICE 'instagram_account_snapshots: anon SELECT kaldırıldı';
  END IF;

  -- instagram_media
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_media') THEN
    DROP POLICY IF EXISTS "anon_read_ig_media" ON public.instagram_media;
    RAISE NOTICE 'instagram_media: anon SELECT kaldırıldı';
  END IF;
END$$;

-- ============================================================
-- 5. DOĞRULAMA — Kalan admin bypass'ları listele
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%is_admin%'
ORDER BY tablename;
