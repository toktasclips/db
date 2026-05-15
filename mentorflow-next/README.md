# Dijital Barista — Next.js V3.0

Modern Next.js migration. Mevcut HTML sistemi (`adminpage.html`) paralelde çalışmaya devam eder.

## Kurulum

```bash
cd mentorflow-next
cp .env.local.example .env.local
# .env.local içine Supabase key'lerini gir
npm install
npm run dev
```

Açık adres: http://localhost:3000

## Env Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=      # Supabase proje URL'i
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
```

Service role key asla frontend'e eklenmez. Edge Function'larda kullanılır.

## Auth Sistemi

- sb.auth.signInWithPassword() ile giriş
- Session cookie'de tutulur (@supabase/ssr)
- Middleware her request'te session'ı yeniler
- Protected route'lar: /dashboard, /protected/*
- Auth olmadan erişim -> /login'e yönlendirme

## Middleware

middleware.ts -> lib/supabase/middleware.ts -> updateSession()

Her request'te supabase.auth.getUser() çağrılır (güvenli, session'dan değil).
Protected path'lerde user yoksa /login redirect.
Auth path'lerde user varsa /dashboard redirect.

## Dosya Yapısı

app/
  login/page.tsx         # Login sayfası
  dashboard/page.tsx     # Ana dashboard
  (protected)/layout.tsx # Korumalı route shell
  auth/callback/route.ts # OAuth callback
  error.tsx              # Global error boundary
  layout.tsx             # Root layout

lib/
  supabase/client.ts     # Browser client
  supabase/server.ts     # Server client
  supabase/middleware.ts # Middleware session updater
  auth/helpers.ts        # getCurrentProfile(), isAdmin()

hooks/useProfile.ts      # Client-side profile hook

types/
  profile.ts             # Profile, UserRole
  auth.ts                # LoginFormValues, AuthError
  database.ts            # DB schema tipleri

components/layout/
  Sidebar.tsx            # Sidebar + logout
  Topbar.tsx             # Topbar
