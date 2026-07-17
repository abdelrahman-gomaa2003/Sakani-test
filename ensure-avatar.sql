-- 1. Ensure verification fields exist on profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
    ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE profiles ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- 2. Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'broker')),
  national_id_front TEXT NOT NULL,
  national_id_back TEXT,
  ownership_document TEXT,
  broker_license TEXT,
  personal_photo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS for verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for verification_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own verification requests') THEN
    CREATE POLICY "Users can view own verification requests" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own verification requests') THEN
    CREATE POLICY "Users can insert own verification requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all verification requests') THEN
    CREATE POLICY "Admins can view all verification requests" ON verification_requests FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all verification requests') THEN
    CREATE POLICY "Admins can update all verification requests" ON verification_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 5. Set existing users as approved
UPDATE profiles SET verification_status = 'approved' WHERE verification_status IS NULL;

-- 6. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('apartment-images', 'apartment-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Admin can SELECT all apartments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all apartments' AND tablename = 'apartments') THEN
    CREATE POLICY "Admins can view all apartments" ON apartments FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 8. Admin can UPDATE all apartments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all apartments' AND tablename = 'apartments') THEN
    CREATE POLICY "Admins can update all apartments" ON apartments FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 9. Admin can DELETE all apartments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete all apartments' AND tablename = 'apartments') THEN
    CREATE POLICY "Admins can delete all apartments" ON apartments FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 10. Admin can UPDATE all profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 11. Admin can DELETE all profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 12. Admin can view all reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all reports' AND tablename = 'apartment_reports') THEN
    CREATE POLICY "Admins can view all reports" ON apartment_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 13. Admin can update all reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all reports' AND tablename = 'apartment_reports') THEN
    CREATE POLICY "Admins can update all reports" ON apartment_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 14. Storage read policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for apartment-images') THEN
    CREATE POLICY "Public read access for apartment-images" ON storage.objects FOR SELECT USING (bucket_id = 'apartment-images');
  END IF;
END $$;

-- 15. Storage upload policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload to apartment-images') THEN
    CREATE POLICY "Authenticated users can upload to apartment-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'apartment-images');
  END IF;
END $$;

-- 16. Storage update policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own files in apartment-images') THEN
    CREATE POLICY "Users can update own files in apartment-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'apartment-images');
  END IF;
END $$;
