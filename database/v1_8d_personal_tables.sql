-- ============================================================
-- V1.8d — ADIM 1: KİŞİSEL VERİ TABLOLARI
-- Önce bunu çalıştır, sonra v1_8e_forum_instagram.sql'i çalıştır.
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

-- Doğrulama
SELECT tablename, policyname, qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients','leads','daily_entries','goals','kanban_cards','competitors')
  AND policyname LIKE '%auth_own%'
ORDER BY tablename;
