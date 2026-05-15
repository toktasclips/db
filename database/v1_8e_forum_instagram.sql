-- ============================================================
-- V1.8e — ADIM 2: FORUM + INSTAGRAM
-- v1_8d çalıştıktan sonra bunu çalıştır.
-- ============================================================

-- ============================================================
-- 1. FORUM_POSTS — user_id yok, admin yönetir
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='forum_posts'
  ) THEN RAISE NOTICE 'forum_posts yok'; RETURN; END IF;

  DROP POLICY IF EXISTS "forum_posts_auth_own"    ON public.forum_posts;
  DROP POLICY IF EXISTS "forum_posts_auth_select"  ON public.forum_posts;
  DROP POLICY IF EXISTS "forum_posts_auth_write"   ON public.forum_posts;

  -- Tüm authenticated kullanıcılar okuyabilir
  CREATE POLICY "forum_posts_auth_select" ON public.forum_posts
    FOR SELECT TO authenticated USING (true);

  -- Sadece admin ekleyebilir/düzenleyebilir/silebilir
  CREATE POLICY "forum_posts_auth_write" ON public.forum_posts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  RAISE NOTICE 'forum_posts: admin-only write, all-read';
END$$;

-- ============================================================
-- 2. FORUM_COMMENTS — user_id var, kullanıcı kendi yorumunu yazar
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='forum_comments'
  ) THEN RAISE NOTICE 'forum_comments yok'; RETURN; END IF;

  DROP POLICY IF EXISTS "forum_comments_auth_own"    ON public.forum_comments;
  DROP POLICY IF EXISTS "forum_comments_auth_select"  ON public.forum_comments;
  DROP POLICY IF EXISTS "forum_comments_auth_write"   ON public.forum_comments;

  -- Tüm authenticated okuyabilir
  CREATE POLICY "forum_comments_auth_select" ON public.forum_comments
    FOR SELECT TO authenticated USING (true);

  -- Kendi yorumunu yazabilir, admin her şeyi yönetebilir
  CREATE POLICY "forum_comments_auth_write" ON public.forum_comments
    FOR ALL TO authenticated
    USING (user_id = (auth.jwt() ->> 'email') OR public.is_admin())
    WITH CHECK (user_id = (auth.jwt() ->> 'email') OR public.is_admin());

  RAISE NOTICE 'forum_comments: all-read, own-write + admin';
END$$;

-- ============================================================
-- 3. FORUM_REACTIONS — user_id var
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='forum_reactions'
  ) THEN RAISE NOTICE 'forum_reactions yok'; RETURN; END IF;

  DROP POLICY IF EXISTS "forum_reactions_auth_own"    ON public.forum_reactions;
  DROP POLICY IF EXISTS "forum_reactions_auth_select"  ON public.forum_reactions;
  DROP POLICY IF EXISTS "forum_reactions_auth_write"   ON public.forum_reactions;

  CREATE POLICY "forum_reactions_auth_select" ON public.forum_reactions
    FOR SELECT TO authenticated USING (true);

  CREATE POLICY "forum_reactions_auth_write" ON public.forum_reactions
    FOR ALL TO authenticated
    USING (user_id = (auth.jwt() ->> 'email') OR public.is_admin())
    WITH CHECK (user_id = (auth.jwt() ->> 'email') OR public.is_admin());

  RAISE NOTICE 'forum_reactions: all-read, own-write + admin';
END$$;

-- ============================================================
-- 4. INSTAGRAM ANON POLICY TEMİZLİĞİ
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
-- Doğrulama
-- ============================================================
SELECT tablename, policyname, qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('forum_posts','forum_comments','forum_reactions',
                    'instagram_connections','instagram_account_snapshots','instagram_media')
ORDER BY tablename, policyname;
