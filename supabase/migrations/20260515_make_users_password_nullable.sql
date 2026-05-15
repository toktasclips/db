-- users.password artık Supabase Auth'a taşındığı için nullable yapılıyor.
-- Eski kullanıcıların plain-text şifreleri korunuyor (NULL'a dönüştürülmüyor).
-- Yeni kullanıcılar admin-create-user Edge Function üzerinden oluşturulur;
-- password alanı boş bırakılır, kimlik doğrulama Supabase Auth üzerinden yapılır.
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
