-- ============================================================
-- Add `data` JSONB column to menus table
-- Stores the full frontend Menu object (sections, dishes, translations)
-- Run this in Supabase SQL Editor after the main schema
-- ============================================================

ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS data JSONB DEFAULT NULL;

-- Add index on is_public for public queries
CREATE INDEX IF NOT EXISTS idx_menus_is_public ON public.menus(is_public);
