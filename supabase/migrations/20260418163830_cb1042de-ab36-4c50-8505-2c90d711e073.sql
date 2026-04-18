
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('manufacturer', 'supplier', 'expert', 'admin');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  country TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  materials TEXT[] DEFAULT '{}',
  sustainability_claims TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Certifications
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Expert reviews
CREATE TABLE public.expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.review_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- Trust scores
CREATE TABLE public.trust_scores (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  approvals INT NOT NULL DEFAULT 0,
  rejections INT NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Saved suppliers
CREATE TABLE public.saved_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);
ALTER TABLE public.saved_suppliers ENABLE ROW LEVEL SECURITY;

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- suppliers
CREATE POLICY "Suppliers viewable by everyone" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Owners insert supplier" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'supplier'));
CREATE POLICY "Owners update supplier" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete supplier" ON public.suppliers FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- products
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Supplier owner inserts product" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid())
);
CREATE POLICY "Supplier owner updates product" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid())
);
CREATE POLICY "Supplier owner deletes product" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- certifications
CREATE POLICY "Certs viewable by everyone" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Supplier owner inserts cert" ON public.certifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p JOIN public.suppliers s ON s.id = p.supplier_id WHERE p.id = product_id AND s.user_id = auth.uid())
);
CREATE POLICY "Supplier owner deletes cert" ON public.certifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products p JOIN public.suppliers s ON s.id = p.supplier_id WHERE p.id = product_id AND s.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- expert_reviews
CREATE POLICY "Reviews viewable by everyone" ON public.expert_reviews FOR SELECT USING (true);
CREATE POLICY "Experts insert reviews" ON public.expert_reviews FOR INSERT WITH CHECK (auth.uid() = expert_id AND public.has_role(auth.uid(), 'expert'));
CREATE POLICY "Experts update own reviews" ON public.expert_reviews FOR UPDATE USING (auth.uid() = expert_id);

-- trust_scores
CREATE POLICY "Trust scores viewable by everyone" ON public.trust_scores FOR SELECT USING (true);

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- saved_suppliers
CREATE POLICY "Users manage own saved suppliers" ON public.saved_suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- inquiries
CREATE POLICY "Manufacturer views own inquiries" ON public.inquiries FOR SELECT USING (
  auth.uid() = manufacturer_id
  OR EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid())
);
CREATE POLICY "Manufacturers create inquiries" ON public.inquiries FOR INSERT WITH CHECK (
  auth.uid() = manufacturer_id AND public.has_role(auth.uid(), 'manufacturer')
);

-- ============ TRIGGERS ============

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.expert_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trust score recalculation
CREATE OR REPLACE FUNCTION public.recalc_trust_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pid UUID;
  approvals_count INT;
  rejections_count INT;
  total_count INT;
  cert_count INT;
  computed_score INT;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);

  SELECT
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*)
  INTO approvals_count, rejections_count, total_count
  FROM public.expert_reviews WHERE product_id = pid;

  SELECT COUNT(*) INTO cert_count FROM public.certifications WHERE product_id = pid;

  -- Score: base 30 + (approvals * 15) - (rejections * 10) + (cert_count * 5), capped 0-100
  computed_score := GREATEST(0, LEAST(100, 30 + (approvals_count * 15) - (rejections_count * 10) + (cert_count * 5)));

  INSERT INTO public.trust_scores (product_id, score, approvals, rejections, total_reviews, updated_at)
  VALUES (pid, computed_score, approvals_count, rejections_count, total_count, now())
  ON CONFLICT (product_id) DO UPDATE
  SET score = EXCLUDED.score,
      approvals = EXCLUDED.approvals,
      rejections = EXCLUDED.rejections,
      total_reviews = EXCLUDED.total_reviews,
      updated_at = now();

  -- Notify supplier
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    SELECT s.user_id,
           'Review update on ' || p.name,
           'Status: ' || NEW.status::text,
           '/products/' || p.id::text
    FROM public.products p JOIN public.suppliers s ON s.id = p.supplier_id
    WHERE p.id = pid;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER reviews_recalc_trust
AFTER INSERT OR UPDATE OR DELETE ON public.expert_reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_trust_score();

-- Initialize trust score on product creation
CREATE OR REPLACE FUNCTION public.init_trust_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.trust_scores (product_id, score) VALUES (NEW.id, 30) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER products_init_trust AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.init_trust_score();

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('certifications', 'certifications', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view certifications" ON storage.objects FOR SELECT USING (bucket_id = 'certifications');
CREATE POLICY "Authenticated upload certifications" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certifications' AND auth.role() = 'authenticated');
CREATE POLICY "Owner deletes certifications" ON storage.objects FOR DELETE USING (bucket_id = 'certifications' AND auth.uid() = owner);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_scores;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.expert_reviews REPLICA IDENTITY FULL;
ALTER TABLE public.trust_scores REPLICA IDENTITY FULL;
