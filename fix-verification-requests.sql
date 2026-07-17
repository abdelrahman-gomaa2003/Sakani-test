-- =====================================================
-- SAKANI: Complete Verification System Redesign
-- =====================================================
-- Run this in Supabase SQL Editor
-- verification_requests is EMPTY — safe to drop/recreate
-- =====================================================

-- 1. Drop old table (empty, no data to lose)
DROP TABLE IF EXISTS verification_requests CASCADE;

-- 2. Create new verification_requests with ALL columns for ALL roles
CREATE TABLE verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'owner', 'broker')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Student-specific (nullable — only filled for students)
  national_id TEXT,
  college TEXT,
  university TEXT,
  student_card_image TEXT,

  -- Owner/Broker shared (nullable — only filled for owner/broker)
  national_id_front TEXT,
  national_id_back TEXT,

  -- Owner-specific (nullable — only filled for owners)
  ownership_document TEXT,

  -- Broker-specific (nullable — only filled for brokers)
  personal_photo TEXT,

  -- Admin fields
  admin_note TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_vr_user_id ON verification_requests(user_id);
CREATE INDEX idx_vr_status ON verification_requests(status);
CREATE INDEX idx_vr_role ON verification_requests(role);

-- 4. RLS policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own verification requests
CREATE POLICY "vr_insert_own" ON verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own verification requests
CREATE POLICY "vr_select_own" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view ALL verification requests
CREATE POLICY "vr_select_admin" ON verification_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update ALL verification requests
CREATE POLICY "vr_update_admin" ON verification_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete verification requests
CREATE POLICY "vr_delete_admin" ON verification_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 5. Fix profiles table — add missing columns
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;

-- Fix university CHECK constraint to allow NULL and all 4 universities
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_university_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_university_check
  CHECK (university IS NULL OR university IN (
    'Fayoum University',
    'Egypt University of Technology',
    'Al-Ahliyya University',
    'Nile University'
  ));

-- =====================================================
-- Summary:
-- verification_requests columns:
--   id, user_id, role, status
--   national_id, college, university, student_card_image  (students)
--   national_id_front, national_id_back                   (owners + brokers)
--   ownership_document                                    (owners)
--   personal_photo                                        (brokers)
--   admin_note, rejection_reason, reviewed_by, reviewed_at
--   created_at, updated_at
--
-- profiles new columns:
--   national_id, college
-- =====================================================
