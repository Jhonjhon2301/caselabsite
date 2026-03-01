
-- Product Reviews
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  customer_name TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews" ON public.product_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admin manage all reviews" ON public.product_reviews
  FOR ALL USING (is_admin());

CREATE POLICY "Users create own reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own reviews" ON public.product_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Referral Program
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID,
  referrer_coupon_id UUID REFERENCES public.coupons(id),
  referred_coupon_id UUID REFERENCES public.coupons(id),
  status TEXT NOT NULL DEFAULT 'pending',
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Admin manage referrals" ON public.referrals
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read by code" ON public.referrals
  FOR SELECT USING (true);

-- Blog Posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  cover_image TEXT,
  author_name TEXT DEFAULT 'Case Lab',
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin manage blog posts" ON public.blog_posts
  FOR ALL USING (is_admin());

-- Add tracking_code to orders for shipment tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Triggers for updated_at
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
