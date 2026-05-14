# V3 Migration Checklist

## Sıra ile yapılacaklar

### Adım 1 — Supabase Dashboard: Admin kullanıcısı oluştur

1. Supabase Dashboard → Authentication → Users
2. "Invite user" veya "Add user" tıkla
3. Email: `admin@mentorflow.com`
4. Password: yeni ve güçlü bir şifre belirle
5. Kullanıcı oluşturulduktan sonra ID'sini kopyala (UUID formatında)

### Adım 2 — Supabase SQL: Admin rolünü profiles'a yaz

```sql
-- auth.users'dan admin'in ID'sini al
SELECT id FROM auth.users WHERE email = 'admin@mentorflow.com';

-- profiles tablosunu güncelle
UPDATE public.profiles
SET auth_user_id = '<buraya_uuid_yapıştır>',
    role = 'admin'
WHERE email = 'admin@mentorflow.com';

-- Yoksa ekle
INSERT INTO public.profiles (auth_user_id, email, full_name, role)
VALUES ('<buraya_uuid_yapıştır>', 'admin@mentorflow.com', 'Admin', 'admin')
ON CONFLICT (email) DO UPDATE
  SET auth_user_id = EXCLUDED.auth_user_id,
      role = 'admin';
```

### Adım 3 — SQL: v3_auth_migration.sql dosyasını çalıştır

Supabase SQL Editor'da `database/v3_auth_migration.sql` içeriğini çalıştır.

Bu dosya:
- Auth trigger'ı kurar (yeni kayıt = otomatik profile)
- is_admin() fonksiyonunu tanımlar
- Tüm tablolara `authenticated` rolü için RLS policy ekler
- Kullanıcı izolasyonunu aktif hale getirir

### Adım 4 — Mevcut kullanıcıları Supabase Auth'a ekle

Her mevcut kullanıcı için:
1. Authentication → Users → Invite user
2. Kullanıcının emailini gir
3. Kullanıcı email'e gelen link ile şifresini kendisi belirler

Alternatif (SQL ile toplu):
```sql
-- Bu sadece Supabase Dashboard'dan veya Edge Function ile yapılabilir.
-- Doğrudan SQL ile auth.users'a ekleme MÜMKÜN DEĞİL.
```

### Adım 5 — Test

1. Admin email + yeni Supabase şifresiyle giriş yap
2. Admin panelin açıldığını doğrula
3. Tüm verilerin göründüğünü doğrula
4. Bir test kullanıcısıyla giriş yap → sadece kendi verisini görmeli

---

## V3 Sonrası Ne Değişti

### Kaldırılan:
- `ADMIN_EMAIL` hardcoded sabiti
- `ADMIN_PASS_HASH` hardcoded sabit (SHA-256 hash)
- `sha256()` JavaScript fonksiyonu
- `users` tablosundan düz şifre karşılaştırması
- `saveUsers()` dummy fonksiyonu

### Eklenen:
- `sb.auth.signInWithPassword()` — gerçek Supabase Auth login
- `_setCurrentUserFromSession()` — session'dan kullanıcı bilgisi çekme
- `sb.auth.onAuthStateChange()` — sayfa yenilenince oturum restore
- `sb.auth.signOut()` — güvenli çıkış
- `handle_new_auth_user()` trigger — yeni auth user = otomatik profile
- `is_admin()` PostgreSQL fonksiyonu — RLS'de admin kontrolü
- `current_user_email()` PostgreSQL fonksiyonu
- `authenticated` rol policy'leri — tüm tablolarda

### Riskler (V4'e kalan):
- `user_id` kolonu hâlâ email formatında (UUID değil) → V4'te migrate edilmeli
- `anon` policy'leri hâlâ aktif (geçiş dönemi) → V4'te kaldırılmalı
- `users` tablosu hâlâ mevcut (login için kullanılmıyor) → V4'te drop edilebilir
- Admin panelden kullanıcı oluşturma hâlâ `users` tablosuna yazıyor → V4'te Supabase Auth API'ye geçmeli

---

## V4 Önerileri

1. `user_id` kolonlarını `auth.uid()` (UUID) formatına migrate et
2. Tüm `anon` policy'lerini kaldır veya daralt
3. Admin panelindeki kullanıcı oluşturma akışını Supabase Auth API'ye bağla
4. `users` tablosunu archive et / drop et
5. Edge Function'lara JWT doğrulaması ekle
