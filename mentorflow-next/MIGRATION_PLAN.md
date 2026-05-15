# Migration Plan — HTML → Next.js

## Mevcut Durum

| Sistem | Konum | Durum |
|--------|-------|-------|
| HTML Admin Paneli | `adminpage.html` | Canlıda çalışıyor |
| Next.js Foundation | `mentorflow-next/` | Geliştirme aşamasında |

HTML sistemi dokunulmadan çalışmaya devam eder. Migration modül modül yapılır.

---

## V3.0 — Foundation (Tamamlandı)

- [x] Next.js App Router + TypeScript + Tailwind
- [x] Supabase Auth (browser / server / middleware client)
- [x] Login sayfası
- [x] Middleware route protection
- [x] Protected layout shell
- [x] Sidebar + Topbar
- [x] getCurrentProfile() / isAdmin() helpers
- [x] useProfile() hook
- [x] Type sistemi (Profile, Auth, Database)
- [x] Error / Loading boundaries

---

## V3.1 — Dashboard Core

- [ ] Günlük Giriş sayfası
- [ ] Dashboard KPI kartları
- [ ] Müşteri listesi (CRM)
- [ ] Edge Function entegrasyonu

---

## V3.2 — CRM + Kullanıcı Yönetimi

- [ ] Müşteriler sayfası
- [ ] Admin kullanıcı ekleme (admin-create-user)
- [ ] Onboarding approval
- [ ] Müşteri Sağlığı takibi

---

## V3.3 — Dersler + İçerik

- [ ] Dersler sayfası
- [ ] Bölüm / Ders yönetimi
- [ ] PDF yükleme (Edge Function)

---

## V3.4 — Chatbot + AI

- [ ] Kişisel Baristan chatbot
- [ ] Sanal Mehmet
- [ ] Chatbot ingest Edge Function

---

## V3.5 — Entegrasyonlar

- [ ] Instagram integration
- [ ] Meta Ads sync
- [ ] Kanban
- [ ] Forum

---

## HTML'de Kalan Sistemler (V3.0 itibarıyla)

Tüm mevcut sistemler HTML'de çalışmaya devam eder:

- Dashboard logic
- CRM / Müşteriler
- Dersler
- Chatbot (Kişisel Baristan, Sanal Mehmet)
- Instagram / Meta Ads
- Kanban
- Forum
- Onboarding approval

---

## Notlar

- `admin-create-user` Edge Function her iki sistemde de kullanılır
- Supabase DB şeması ortak — migration sırasında tablo değişikliği yapma
- Auth: HTML sistemi `signInWithPassword()` kullanıyor, Next.js de aynısını kullanıyor — session uyumlu
