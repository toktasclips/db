-- ============================================================
-- V2 PATCH — contents, events, tasks tabloları RLS eksikti
-- Supabase SQL Editor'da çalıştır (tek seferlik)
-- ============================================================

DO $$
DECLARE
  tbl text;
  missing_tables text[] := ARRAY['contents','events','tasks'];
BEGIN
  FOREACH tbl IN ARRAY missing_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE NOTICE 'Atlandı (tablo yok): %', tbl;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_anon_all" ON public.%I', tbl, tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_all" ON public.%I', tbl, tbl
    );

    EXECUTE format(
      'CREATE POLICY "%s_anon_all" ON public.%I
         FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_service_all" ON public.%I
         FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl, tbl
    );

    RAISE NOTICE 'RLS aktif: %', tbl;
  END LOOP;
END$$;

-- Doğrulama
SELECT tablename, rowsecurity AS rls_aktif,
       (SELECT COUNT(*) FROM pg_policies p
        WHERE p.tablename = t.tablename AND p.schemaname = 'public') AS policy_sayisi
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('contents','events','tasks')
ORDER BY tablename;
