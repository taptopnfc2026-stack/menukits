-- ============================================================
-- MenuKits Database Schema — Phase 1
-- Run this in Supabase SQL Editor:
--   https://vogadmkyyuvamjfvcdeo.supabase.com → SQL Editor → New Query
-- ============================================================

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  opening_hours JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menus table
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT false,
  template TEXT DEFAULT 'default',
  cover_image_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  category TEXT DEFAULT '',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  allergens JSONB DEFAULT '[]'::jsonb,
  dietary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — Profiles
-- ============================================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- RLS Policies — Restaurants
-- ============================================================
CREATE POLICY "Users can view own restaurants" ON public.restaurants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurants" ON public.restaurants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurants" ON public.restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies — Menus
-- ============================================================
-- Anyone can view public menus (for QR code scanning)
CREATE POLICY "Anyone can view public menus" ON public.menus
  FOR SELECT USING (is_public = true);

-- Users can view their own menus
CREATE POLICY "Users can view own menus" ON public.menus
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menus" ON public.menus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menus" ON public.menus
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own menus" ON public.menus
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies — Menu Items
-- ============================================================
-- View items of public menus OR own menus
CREATE POLICY "View items of accessible menus" ON public.menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_items.menu_id
      AND (menus.is_public = true OR menus.user_id = auth.uid())
    )
  );

-- Insert items into own menus
CREATE POLICY "Insert items into own menus" ON public.menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_items.menu_id AND menus.user_id = auth.uid()
    )
  );

-- Update items in own menus
CREATE POLICY "Update items in own menus" ON public.menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_items.menu_id AND menus.user_id = auth.uid()
    )
  );

-- Delete items from own menus
CREATE POLICY "Delete items from own menus" ON public.menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_items.menu_id AND menus.user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON public.menus(user_id);
CREATE INDEX IF NOT EXISTS idx_menus_slug ON public.menus(slug);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);

-- ============================================================
-- Trigger: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['profiles', 'restaurants', 'menus', 'menu_items'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- Handle new user signup: auto-create profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  -- Also create a default restaurant for the new user
  INSERT INTO public.restaurants (user_id, name)
  VALUES (NEW.id, 'My Restaurant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
