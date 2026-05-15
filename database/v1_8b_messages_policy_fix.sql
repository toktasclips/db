-- ============================================================
-- V1.8b — MESSAGES POLICY FİX
-- messages tablosu user_id değil sender_email/receiver_email kullanıyor.
-- v1_8_rls_select_isolation.sql'deki hatalı messages bloğunu düzeltir.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages'
  ) THEN
    RAISE NOTICE 'messages tablosu yok, atlandı';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "messages_auth_own"   ON public.messages;
  DROP POLICY IF EXISTS "messages_auth_select" ON public.messages;
  DROP POLICY IF EXISTS "messages_auth_write"  ON public.messages;

  -- Kullanıcı kendi gönderdiği veya aldığı mesajları görebilir.
  -- Admin tüm thread'leri görebilir (mesajlaşma sistemi için gerekli).
  CREATE POLICY "messages_auth_own" ON public.messages
    FOR ALL TO authenticated
    USING (
      sender_email   = (auth.jwt() ->> 'email')
      OR receiver_email = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
    WITH CHECK (
      sender_email = (auth.jwt() ->> 'email')
      OR public.is_admin()
    );

  RAISE NOTICE 'messages policy düzeltildi (sender_email/receiver_email)';
END$$;

-- Doğrulama
SELECT policyname, cmd, qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'messages';
