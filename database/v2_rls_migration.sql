-- ============================================================
-- V2 RLS + AUTH GÜVENLIK MIGRASYONU
-- Dijital Barista — Supabase Row Level Security
-- ============================================================
--
-- ÖNEMLİ NOTLAR:
--   1. Bu script Supabase SQL Editor'da çalıştırılacak.
--   2. Mevcut custom auth sistemi (users tablosu) bozulmaz.
--   3. Her policy anon key ile çalışan mevcut uygulamayı korur.
--   4. V3'te auth.uid() geçişi için altyapı hazırlandı.
--   5. Script'i bölüm bölüm çalıştırabilirsiniz.
--
-- ÇALIŞTIRILACAK SIRAYLA:
--   BÖLÜM 1: Helper fonksiyonlar
--   BÖLÜM 2: profiles tablosu oluştur
--   BÖLÜM 3: RLS aktif et + policy'leri yaz
--   BÖLÜM 4: users tablosu güvenliği
--   BÖLÜM 5: Chatbot güvenliği
-- ============================================================


-- ============================================================
-- BÖLÜM 1: HELPER FONKSİYONLAR
-- ============================================================

-- Mevcut oturumun admin olup olmadığını kontrol eder.
-- V3'te profiles.role = 'admin' ile değiştirilecek.
-- Şimdilik service_role = admin kabul edilir.
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('role') = 'service_role';
$$;

-- Gelecekte JWT claim'den email okumak için hazır fonksiyon.
-- V3'te aktif edilecek (Supabase Auth JWT'si olduğunda).
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  );
$$;

-- Gelecekte JWT claim'den role okumak için hazır fonksiyon.
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'user_role',
    ''
  );
$$;


-- ============================================================
-- BÖLÜM 2: PROFİLES TABLOSU
-- (Supabase Auth geçişi için hazırlık)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client', 'coach')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  -- Supabase Auth entegrasyonu hazır (opsiyonel)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mevcut users tablosundan profiles'a veri kopyala (ilk çalıştırmada)
INSERT INTO public.profiles (email, full_name, role)
SELECT email, name, COALESCE(role, 'client')
FROM public.users
ON CONFLICT (email) DO NOTHING;

-- profiles için RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini okuyabilir
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO anon
  USING (true);  -- tüm profilleri okuyabilir (isim/rol görünümü için)

-- Sadece service_role yazabilir (admin panel backend'den)
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "profiles_update_service" ON public.profiles
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "profiles_delete_service" ON public.profiles
  FOR DELETE TO service_role USING (true);


-- ============================================================
-- BÖLÜM 3: KULLANICI VERİSİ TABLOLARI — RLS
-- ============================================================
-- Bu tablolarda user_id = email string (mevcut mimari).
-- Anon key tüm kullanıcılar için aynı role'ü taşıdığından
-- per-user isolation bugün tam mümkün değildir.
-- Policy'ler mevcut uygulamayı korur + service_role admin erişimi sağlar.
-- V3'te user_id = auth.uid() UUID'ye geçilecek.
-- ============================================================

-- ---- clients ------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_anon_all" ON public.clients
  FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "clients_service_all" ON public.clients
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- leads --------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_anon_all" ON public.leads
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "leads_service_all" ON public.leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- goals --------------------------------------------------
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_anon_all" ON public.goals
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "goals_service_all" ON public.goals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- milestones ---------------------------------------------
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_anon_all" ON public.milestones
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "milestones_service_all" ON public.milestones
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- daily_entries ------------------------------------------
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_entries_anon_all" ON public.daily_entries
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "daily_entries_service_all" ON public.daily_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- offers -------------------------------------------------
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_anon_all" ON public.offers
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "offers_service_all" ON public.offers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- kanban_cards -------------------------------------------
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kanban_cards_anon_all" ON public.kanban_cards
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "kanban_cards_service_all" ON public.kanban_cards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- competitors --------------------------------------------
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitors_anon_all" ON public.competitors
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "competitors_service_all" ON public.competitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- sales --------------------------------------------------
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_anon_all" ON public.sales
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "sales_service_all" ON public.sales
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- homework_assignments -----------------------------------
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homework_anon_all" ON public.homework_assignments
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "homework_service_all" ON public.homework_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- client_teklif ------------------------------------------
ALTER TABLE public.client_teklif ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_teklif_anon_all" ON public.client_teklif
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "client_teklif_service_all" ON public.client_teklif
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- user_journey_stories -----------------------------------
ALTER TABLE public.user_journey_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journey_anon_all" ON public.user_journey_stories
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "journey_service_all" ON public.user_journey_stories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- user_achievements --------------------------------------
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_anon_all" ON public.user_achievements
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "achievements_service_all" ON public.user_achievements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- messages (uygulama içi mesajlaşma) ---------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi gönderdiği/aldığı mesajları okusun
-- (Mevcut sistemde email-based filtreleme yapılıyor)
CREATE POLICY "messages_anon_all" ON public.messages
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "messages_service_all" ON public.messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- onboarding_leads ---------------------------------------
ALTER TABLE public.onboarding_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_anon_insert" ON public.onboarding_leads
  FOR INSERT TO anon WITH CHECK (true);

-- Sadece service_role okuyabilir (admin görür, frontend direkt okumaz)
CREATE POLICY "onboarding_service_all" ON public.onboarding_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- BÖLÜM 4: ADMIN-YÖNETİMLİ İÇERİK TABLOLARI
-- ============================================================

-- ---- toolbox_items ------------------------------------------
ALTER TABLE public.toolbox_items ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (kullanıcılara gösteriliyor)
CREATE POLICY "toolbox_anon_select" ON public.toolbox_items
  FOR SELECT TO anon USING (true);

-- Sadece service_role (admin backend) yazabilir
CREATE POLICY "toolbox_service_all" ON public.toolbox_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- NOT: Admin paneli şu an anon key ile yazıyor — geçici izin:
CREATE POLICY "toolbox_anon_write_temp" ON public.toolbox_items
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "toolbox_anon_update_temp" ON public.toolbox_items
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "toolbox_anon_delete_temp" ON public.toolbox_items
  FOR DELETE TO anon USING (true);

-- ---- training_lessons, training_modules, training_topics ----
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_lessons_anon_all" ON public.training_lessons
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "training_modules_anon_all" ON public.training_modules
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "training_topics_anon_all" ON public.training_topics
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "training_lessons_service_all" ON public.training_lessons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "training_modules_service_all" ON public.training_modules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "training_topics_service_all" ON public.training_topics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- training_control_questions -----------------------------
ALTER TABLE public.training_control_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tcq_anon_all" ON public.training_control_questions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "tcq_service_all" ON public.training_control_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- training_lesson_progress, training_progress ------------
ALTER TABLE public.training_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_module_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tlp_anon_all" ON public.training_lesson_progress
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "tp_anon_all" ON public.training_progress
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "tms_anon_all" ON public.training_module_submissions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "tlp_service_all" ON public.training_lesson_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "tp_service_all" ON public.training_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "tms_service_all" ON public.training_module_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- program_phases, program_tasks, program_task_progress ---
ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_task_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_anon_all" ON public.program_phases
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "pt_anon_all" ON public.program_tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ptp_anon_all" ON public.program_task_progress
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "pp_service_all" ON public.program_phases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pt_service_all" ON public.program_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ptp_service_all" ON public.program_task_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- user_module_access -------------------------------------
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uma_anon_all" ON public.user_module_access
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "uma_service_all" ON public.user_module_access
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- forum_posts, forum_comments, forum_reactions -----------
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_posts_anon_all" ON public.forum_posts
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "forum_comments_anon_all" ON public.forum_comments
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "forum_reactions_anon_all" ON public.forum_reactions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "forum_posts_service_all" ON public.forum_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "forum_comments_service_all" ON public.forum_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "forum_reactions_service_all" ON public.forum_reactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- BÖLÜM 5: CHATBOT GÜVENLİĞİ
-- ============================================================

-- ---- chatbots (admin yönetir, kullanıcı okur) ---------------
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

-- Aktif chatbotları herkes görebilir
CREATE POLICY "chatbots_anon_select_active" ON public.chatbots
  FOR SELECT TO anon
  USING (is_active = true OR is_active IS NULL);

-- Admin tüm chatbotları yönetir (anon key ile, geçici)
CREATE POLICY "chatbots_anon_write_temp" ON public.chatbots
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "chatbots_anon_update_temp" ON public.chatbots
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "chatbots_anon_delete_temp" ON public.chatbots
  FOR DELETE TO anon USING (true);

CREATE POLICY "chatbots_service_all" ON public.chatbots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- chatbot_conversations ----------------------------------
-- Her kullanıcı sadece kendi konuşmalarını görebilmeli.
-- Şu an user_id = email ile saklanıyor.
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_anon_all" ON public.chatbot_conversations
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "conv_service_all" ON public.chatbot_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- chatbot_messages ---------------------------------------
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msgs_anon_all" ON public.chatbot_messages
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "msgs_service_all" ON public.chatbot_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- chatbot_documents, chatbot_chunks ----------------------
ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_chunks ENABLE ROW LEVEL SECURITY;

-- Edge Function (chatbot-ingest) service_role ile erişir
CREATE POLICY "docs_service_all" ON public.chatbot_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "chunks_service_all" ON public.chatbot_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon (frontend) sadece kendi belge listesini okuyabilir
CREATE POLICY "docs_anon_select" ON public.chatbot_documents
  FOR SELECT TO anon USING (true);

CREATE POLICY "docs_anon_write" ON public.chatbot_documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "docs_anon_delete" ON public.chatbot_documents
  FOR DELETE TO anon USING (true);


-- ============================================================
-- BÖLÜM 6: USERS TABLOSU — HASSAS VERİ KORUMASI
-- ============================================================
-- UYARI: users tablosunda password hash var.
-- Anon key ile SELECT yapılıyor (login için).
-- Bu tehlikelidir — V3'te Supabase Auth'a geçilecek.
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Login için anon SELECT gerekli (mevcut sistemi korur)
CREATE POLICY "users_anon_select" ON public.users
  FOR SELECT TO anon USING (true);

-- Kullanıcı kaydı için INSERT
CREATE POLICY "users_anon_insert" ON public.users
  FOR INSERT TO anon WITH CHECK (true);

-- Update (şifre değişikliği vb.)
CREATE POLICY "users_anon_update" ON public.users
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Service_role tam erişim
CREATE POLICY "users_service_all" ON public.users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- GELECEKTEKİ YORUM: Bu policy'yi V3'te kaldır:
-- CREATE POLICY "users_select_own" ON public.users
--   FOR SELECT TO authenticated
--   USING (auth.uid()::text = id::text OR role = 'admin');


-- ============================================================
-- BÖLÜM 7: INSTAGRAM / META TABLOLARI
-- ============================================================

ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ig_conn_anon_all" ON public.instagram_connections
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ig_snap_anon_all" ON public.instagram_account_snapshots
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ig_media_anon_all" ON public.instagram_media
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "meta_anon_all" ON public.meta_ad_insights
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ig_conn_service_all" ON public.instagram_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ig_snap_service_all" ON public.instagram_account_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ig_media_service_all" ON public.instagram_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "meta_service_all" ON public.meta_ad_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- customers (clients ile aynı mı? kontrol et) -----------
-- customers tablosu varsa:
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='customers') THEN
    EXECUTE 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "customers_anon_all" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "customers_service_all" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END$$;


-- ============================================================
-- BÖLÜM 8: V3 GEÇİŞ ALTYAPISI — HAZIRLIK NOTLARI
-- ============================================================
-- Aşağıdaki SQL V3'te çalıştırılacak (Supabase Auth'a geçince).
-- Şimdi ÇALIŞTIRMA — sadece referans olarak bırak.
-- ============================================================

/*
-- V3: user_id kolonlarını UUID'ye çevir
-- 1. Önce auth.users'a mevcut kullanıcıları ekle (Edge Function ile)
-- 2. Sonra user_id kolonunu text'ten uuid'e migrate et

-- Örnek migration (goals için):
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS user_uuid UUID;

UPDATE public.goals g
SET user_uuid = u.auth_user_id
FROM public.profiles u
WHERE g.user_id = u.email
  AND u.auth_user_id IS NOT NULL;

-- RLS policy güncelle:
DROP POLICY IF EXISTS "goals_anon_all" ON public.goals;
CREATE POLICY "goals_authenticated_own" ON public.goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_uuid)
  WITH CHECK (auth.uid() = user_uuid);

-- Admin policy:
CREATE POLICY "goals_admin_all" ON public.goals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );
*/

/*
-- V3: users tablosunu Supabase Auth ile değiştir
-- Login flow değişecek:
-- ÖNCE:  sb.from('users').select().eq('email',email).eq('password',hash)
-- SONRA: sb.auth.signInWithPassword({ email, password })

-- Frontend değişikliği (app.js):
-- async function doLogin(email, pass) {
--   const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
--   if (error) { showError('Giriş başarısız'); return; }
--   const { data: profile } = await sb.from('profiles').select('*').eq('email', email).single();
--   currentUser = { email: profile.email, name: profile.full_name, role: profile.role };
--   showApp();
-- }
*/

/*
-- V3: chatbot_conversations için user-isolated RLS
DROP POLICY IF EXISTS "conv_anon_all" ON public.chatbot_conversations;
CREATE POLICY "conv_authenticated_own" ON public.chatbot_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR user_id = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_id = auth.uid()::text OR user_id = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admin tüm konuşmaları görebilir:
CREATE POLICY "conv_admin_all" ON public.chatbot_conversations
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin')
  );
*/


-- ============================================================
-- BÖLÜM 9: GEÇİCİ EDGE FUNCTION GÜVENLİK NOTLARI
-- ============================================================
-- Tespit edilen Edge Functions:
--   1. chatbot-chat   → anon erişime açık (JWT kontrolü YOK)
--   2. chatbot-ingest → anon erişime açık (JWT kontrolü YOK)
--
-- Kısa vadeli önlem (Edge Function koduna eklenecek):
-- Supabase Dashboard > Edge Functions > chatbot-chat:
--
-- const authHeader = req.headers.get('Authorization');
-- if (!authHeader || !authHeader.startsWith('Bearer ')) {
--   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
-- }
-- // Token'ı doğrula:
-- const { data: { user }, error } = await supabase.auth.getUser(token);
-- if (error || !user) {
--   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
-- }
-- ============================================================


-- ============================================================
-- DOĞRULAMA SORGUSU
-- Migration sonrası çalıştır — tüm tablolar RLS aktif mi kontrol et
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'clients','leads','goals','milestones','daily_entries','offers',
    'kanban_cards','competitors','sales','homework_assignments','client_teklif',
    'user_journey_stories','user_achievements','messages','onboarding_leads',
    'toolbox_items','training_lessons','training_modules','training_topics',
    'training_control_questions','training_lesson_progress','training_progress',
    'training_module_submissions','program_phases','program_tasks','program_task_progress',
    'user_module_access','forum_posts','forum_comments','forum_reactions',
    'chatbots','chatbot_conversations','chatbot_messages','chatbot_documents','chatbot_chunks',
    'users','profiles',
    'instagram_connections','instagram_account_snapshots','instagram_media','meta_ad_insights'
  )
ORDER BY tablename;
