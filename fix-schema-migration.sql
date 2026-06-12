-- ============================================================
-- MenuKits Database Migration — Fix Missing Columns
--
-- Run this in Supabase SQL Editor:
--   https://vogadmkyyuvamjfvcdeo.supabase.co → SQL Editor → New Query
--
-- This adds columns that the code needs but the original schema missed.
-- ============================================================

-- 1. Add 'slug' to restaurants (for hub URL like /hub/my-restaurant)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS slug TEXT;

-- Ensure existing rows get auto-generated slugs if empty
UPDATE public.restaurants SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Add unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug) WHERE slug IS NOT NULL AND slug != '';

-- 2. Add 'cover_image_url' to restaurants (optional, used by frontend)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 3. Add 'data' to menus (stores full menu JSON: sections, dishes, etc.)
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
