-- Bakiye varsayılanını 2 SOL yap (yeni kayıtlar + mevcut 1000 olanlar)
-- Supabase SQL Editor'da çalıştırın.

-- 1) Yeni satırlar için varsayılan 2 SOL
ALTER TABLE public.profiles
  ALTER COLUMN sim_sol SET DEFAULT 2;

-- 2) Zaten 1000 olan tüm hesapları 2 SOL yap (isteğe bağlı)
UPDATE public.profiles
  SET sim_sol = 2
  WHERE sim_sol = 1000;

-- 3) Auth ile yeni kullanıcı oluşunca 2 SOL ile profil açan trigger (varsa güncelle)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, sim_sol) VALUES (new.id, 2)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
