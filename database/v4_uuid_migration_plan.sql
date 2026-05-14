-- ============================================================
-- V4 UUID MİGRASYON PLANI
-- Bu dosya henüz çalıştırılmayacak — plan ve hazırlık amaçlıdır.
-- V4'e geçmeden önce oku, incele, onaydan sonra uygula.
-- ============================================================

-- ============================================================
-- MEVCUT DURUM (V3 sonrası)
-- user_id kolonları email formatında duruyor (string).
-- Örnek: user_id = 'zeynep@email.com'
-- Hedef:  user_id = auth.uid() (UUID, örn: 'a1b2c3d4-...')
-- ============================================================

-- ============================================================
-- HANGİ TABLOLARDA user_id EMAIL OLARAK DURUYOR?
-- ============================================================
/*
Tablo                        | Kolon(lar)
-----------------------------|------------------------------------------
clients                      | user_id
leads                        | user_id
goals                        | user_id
milestones                   | user_id
daily_entries                | user_id
offers                       | user_id
kanban_cards                 | user_id
competitors                  | user_id
sales                        | user_id
homework_assignments         | user_id
client_teklif                | user_id
user_journey_stories         | user_id
user_achievements            | user_id
messages                     | (user/thread identifier)
customers                    | (email ile bağlı, doğrudan user_id yok)
onboarding_leads             | (email ile bağlı)
instagram_connections        | user_id
instagram_account_snapshots  | user_id
instagram_media              | user_id
instagram_media_daily_stats  | user_id
meta_ad_insights             | user_id
chatbot_conversations        | user_id
chatbot_messages             | (session bağlı)
training_progress            | user_id
training_module_submissions  | user_id
program_phases               | user_id
program_tasks                | user_id
program_task_progress        | user_id
user_module_access           | user_id
forum_posts                  | user_id
forum_comments               | user_id
forum_reactions              | user_id
contents                     | user_id (varsa)
events                       | user_id (varsa)
tasks                        | user_id (varsa)
*/

-- ============================================================
-- MİGRASYON ADIMLARI (SIRASINDA YAP)
-- ============================================================

-- ADIM 1: profiles tablosunda email → auth_user_id eşlemesi hazır olmalı
-- (V3 migration'da handle_new_auth_user trigger bunu yapıyor)

-- Kontrol:
-- SELECT COUNT(*) FROM public.profiles WHERE auth_user_id IS NULL;
-- Bu 0 olmalı (veya sadece migrate edilmemiş eski kullanıcılar)

-- ADIM 2: Her tabloya yeni UUID kolonu ekle (yavaş migration)
/*
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS user_uuid UUID REFERENCES auth.users(id);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS user_uuid UUID REFERENCES auth.users(id);

-- ... (diğer tablolar için aynısı)
*/

-- ADIM 3: Email → UUID eşlemesi yap (profiles tablosu üzerinden)
/*
UPDATE public.clients c
SET user_uuid = p.auth_user_id
FROM public.profiles p
WHERE p.email = c.user_id
  AND c.user_uuid IS NULL;

UPDATE public.leads l
SET user_uuid = p.auth_user_id
FROM public.profiles p
WHERE p.email = l.user_id
  AND l.user_uuid IS NULL;

-- ... (diğer tablolar için aynısı)
*/

-- ADIM 4: RLS policy'lerini user_uuid üzerinden güncelle
/*
-- Önce yeni policy ekle (hem email hem uuid destekle)
CREATE POLICY "clients_auth_own_v4" ON public.clients
  FOR ALL TO authenticated
  USING (
    user_uuid = auth.uid()
    OR user_id = (auth.jwt() ->> 'email')  -- geçiş dönemi fallback
    OR public.is_admin()
  )
  WITH CHECK (
    user_uuid = auth.uid()
    OR public.is_admin()
  );

-- Test et, sonra eski policy'i kaldır
DROP POLICY IF EXISTS "clients_auth_own" ON public.clients;
*/

-- ADIM 5: Frontend'de user_id yazımını UUID'ye çevir
/*
-- Supabase INSERT sırasında:
-- Eski: user_id: currentUser.email
-- Yeni: user_id: currentUser.id  (auth.uid())
-- NOT: Hem user_id hem user_uuid yazılabilir (geçiş dönemi)
*/

-- ADIM 6: Eski user_id (email) kolonunu kaldır
/*
-- YETERLİ TEST SONRASI:
ALTER TABLE public.clients RENAME COLUMN user_id TO user_id_legacy;
ALTER TABLE public.clients RENAME COLUMN user_uuid TO user_id;

-- Tüm veriler doğru geliyorsa:
ALTER TABLE public.clients DROP COLUMN user_id_legacy;
*/

-- ADIM 7: users tablosunu arşivle / kaldır
/*
-- Tüm kullanıcılar Supabase Auth'a taşındıktan sonra:
ALTER TABLE public.users RENAME TO users_legacy_archive;
-- Veya:
DROP TABLE public.users;
*/

-- ============================================================
-- RİSK DEĞERLENDİRMESİ
-- ============================================================
/*
Risk 1: Email değişirse user_id eşlemesi bozulur
  → Çözüm: UUID migration tamamlanınca bu risk ortadan kalkar

Risk 2: Migration sırasında bazı kullanıcılar hem eski hem yeni sistemde
  → Çözüm: Geçiş dönemi dual-policy (email OR uuid)

Risk 3: Büyük tablolarda UPDATE yavaş olabilir
  → Çözüm: CONCURRENTLY veya sayfalı UPDATE kullan

Risk 4: Frontend'de user_id değişince mevcut filtreler bozulabilir
  → Çözüm: Tek tek test et, önce geliştiricilerde dene
*/

-- ============================================================
-- KONTROL SORGUSU — V4 öncesi çalıştır
-- ============================================================
/*
SELECT
  tablename,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('user_id', 'owner_id', 'created_by')
ORDER BY tablename, column_name;
*/
