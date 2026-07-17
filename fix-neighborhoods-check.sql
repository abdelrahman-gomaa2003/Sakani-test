-- ============================================
-- Migration: Update neighborhoods CHECK constraint
-- The DB only allowed old English values (Dallah, El Hadqa, etc.)
-- The frontend uses slug-style values (dala, sawaqi, etc.)
-- This migration replaces the CHECK constraint to match the frontend.
-- Execute via: Supabase Dashboard > SQL Editor
-- ============================================

-- Drop the old CHECK constraint and create new one with all 14 neighborhoods
ALTER TABLE apartments DROP CONSTRAINT IF EXISTS apartments_neighborhood_check;

ALTER TABLE apartments ADD CONSTRAINT apartments_neighborhood_check
  CHECK (neighborhood IN (
    'dala',
    'sawaqi',
    'algon',
    'central',
    'hawatem',
    'lotfallah',
    'sawy',
    'baghouz',
    'keman-fares',
    'salakhana',
    'sheikh-hassan',
    'damo',
    'masla',
    'dar-alramad'
  ));

-- Verify: run this to confirm the constraint exists
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'apartments'::regclass
  AND contype = 'c';
