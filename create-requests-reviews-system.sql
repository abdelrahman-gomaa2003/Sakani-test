-- ============================================================
-- Sakani Platform: Viewing Requests, Booking Requests, Reviews
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- 1. Viewing Requests (طلبات المعاينة)
CREATE TABLE IF NOT EXISTS viewing_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewing_date DATE NOT NULL,
  viewing_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- Students can read their own viewing requests
CREATE POLICY "Students view own viewing requests" ON viewing_requests
  FOR SELECT USING (auth.uid() = student_id);

-- Owners/brokers can read viewing requests for their apartments
CREATE POLICY "Owners view requests for their apartments" ON viewing_requests
  FOR SELECT USING (auth.uid() = owner_id);

-- Admins can read all viewing requests
CREATE POLICY "Admins view all viewing requests" ON viewing_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Students can insert viewing requests
CREATE POLICY "Students create viewing requests" ON viewing_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Owners/brokers can update status of their apartment requests
CREATE POLICY "Owners update viewing request status" ON viewing_requests
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admins can update any viewing request
CREATE POLICY "Admins update any viewing request" ON viewing_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Booking Requests (طلبات الحجز)
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0 AND duration_months <= 24),
  num_persons INTEGER NOT NULL DEFAULT 1 CHECK (num_persons > 0 AND num_persons <= 10),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own booking requests" ON booking_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Owners view booking requests for their apartments" ON booking_requests
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins view all booking requests" ON booking_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students create booking requests" ON booking_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Owners update booking request status" ON booking_requests
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Students cancel own booking requests" ON booking_requests
  FOR UPDATE USING (auth.uid() = student_id AND status = 'approved');

CREATE POLICY "Admins update any booking request" ON booking_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students delete own pending booking requests" ON booking_requests
  FOR DELETE USING (auth.uid() = student_id AND status = 'pending');

-- 3. Owner/Broker Reviews (تقييم المالك/الوسيط)
CREATE TABLE IF NOT EXISTS owner_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, booking_request_id)
);

ALTER TABLE owner_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read owner reviews
CREATE POLICY "Public read owner reviews" ON owner_reviews
  FOR SELECT USING (true);

-- Students can insert reviews (after approved booking)
CREATE POLICY "Students create owner reviews" ON owner_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM booking_requests
      WHERE id = booking_request_id
      AND student_id = auth.uid()
      AND status = 'approved'
    )
  );

CREATE POLICY "Students delete own owner reviews" ON owner_reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- 4. Property Reviews (تقييم العقار) - extended from existing reviews table
-- We extend the existing 'reviews' table with additional columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS safety INTEGER CHECK (safety >= 1 AND safety <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS near_university INTEGER CHECK (near_university >= 1 AND near_university <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_accuracy INTEGER CHECK (image_accuracy >= 1 AND image_accuracy <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_viewing_requests_student ON viewing_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_owner ON viewing_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_apartment ON viewing_requests(apartment_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);

CREATE INDEX IF NOT EXISTS idx_booking_requests_student ON booking_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_owner ON booking_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_apartment ON booking_requests(apartment_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);

CREATE INDEX IF NOT EXISTS idx_owner_reviews_reviewed ON owner_reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_owner_reviews_reviewer ON owner_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_owner_reviews_booking ON owner_reviews(booking_request_id);

-- 6. Functions to update updated_at
CREATE OR REPLACE FUNCTION update_viewing_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_booking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS viewing_requests_updated_at ON viewing_requests;
CREATE TRIGGER viewing_requests_updated_at
  BEFORE UPDATE ON viewing_requests
  FOR EACH ROW EXECUTE FUNCTION update_viewing_requests_updated_at();

DROP TRIGGER IF EXISTS booking_requests_updated_at ON booking_requests;
CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_booking_requests_updated_at();

-- Done!
