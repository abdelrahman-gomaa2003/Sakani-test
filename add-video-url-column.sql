-- ============================================
-- Migration: Add missing columns to apartments
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Execute via: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Add video_url column (missing - causes PGRST204 error)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE apartments ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- 2. Add latitude column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE apartments ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
END $$;

-- 3. Add longitude column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE apartments ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- 4. Add views column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'views'
  ) THEN
    ALTER TABLE apartments ADD COLUMN views INTEGER DEFAULT 0;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN apartments.video_url IS 'URL of apartment video stored in Supabase Storage';
COMMENT ON COLUMN apartments.latitude IS 'Geographic latitude of apartment location';
COMMENT ON COLUMN apartments.longitude IS 'Geographic longitude of apartment location';
COMMENT ON COLUMN apartments.views IS 'Number of times this apartment has been viewed';

-- Verify: Run this to check all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'apartments'
ORDER BY ordinal_position;
