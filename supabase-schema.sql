-- ============================================
-- 1. جدول المستخدمين (profiles)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone VARCHAR(20),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner', 'broker', 'admin')),
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  avatar_url TEXT,
  city TEXT DEFAULT 'Fayoum',
  university TEXT CHECK (university IN (
    'Fayoum University',
    'Beni Suef Technological University'
  )),
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'approved' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  id_card_url TEXT,
  id_card_back_url TEXT,
  proof_document_url TEXT,
  personal_photo_url TEXT,
  rejection_reason TEXT,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. جدول العقارات (apartments)
-- ============================================
CREATE TABLE apartments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  city TEXT DEFAULT 'Fayoum' CHECK (city = 'Fayoum'),
  neighborhood TEXT CHECK (neighborhood IN (
    'Dallah',
    'El Hadqa',
    'El Gamea',
    'El Masalla',
    'Keman Fares',
    'Qahafa',
    'Dar El Ramad'
  )),
  address TEXT,
  price NUMERIC(10,2) NOT NULL,
  apartment_type TEXT CHECK (apartment_type IN ('room', 'apartment', 'shared', 'studio')),
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  area NUMERIC(8,2),
  floor_number INT,
  available_from DATE,
  images TEXT[] DEFAULT '{}',
  wifi BOOLEAN DEFAULT false,
  electricity BOOLEAN DEFAULT true,
  water BOOLEAN DEFAULT true,
  gas BOOLEAN DEFAULT false,
  amenities TEXT[] DEFAULT '{}',
  university TEXT CHECK (university IN (
    'Fayoum University',
    'Beni Suef Technological University'
  )),
  views INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'rented')),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. جدول المفضلة (favorites)
-- ============================================
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, apartment_id)
);

-- ============================================
-- 4. جدول الرسائل (messages)
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. جدول التنبيهات (notifications)
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. جدول التقييمات (reviews)
-- ============================================
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  owner_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, apartment_id)
);

-- ============================================
-- 7. جدول طلبات التوثيق (verification_requests)
-- ============================================
CREATE TABLE verification_requests (
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

-- ============================================
-- 8. جدول البلاغات (apartment_reports)
-- ============================================
CREATE TABLE apartment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- apartments
CREATE POLICY "Approved apartments viewable by everyone" ON apartments FOR SELECT USING (status = 'approved' OR owner_id = auth.uid());
CREATE POLICY "Admins can view all apartments" ON apartments FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Owners can insert apartments" ON apartments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own apartments" ON apartments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can update all apartments" ON apartments FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Owners can delete own apartments" ON apartments FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can delete all apartments" ON apartments FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- favorites
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark own messages as read" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can mark own as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- reviews
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- apartment_reports
CREATE POLICY "Users can view own reports" ON apartment_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON apartment_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert reports" ON apartment_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update all reports" ON apartment_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- verification_requests
CREATE POLICY "Users can view own verification requests" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verification requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all verification requests" ON verification_requests FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all verification requests" ON verification_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 9. Functions & Triggers
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON apartments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. RPC Functions
-- ============================================

-- Increment apartment views counter
CREATE OR REPLACE FUNCTION increment_apartment_views(apartment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE apartments
  SET views = COALESCE(views, 0) + 1
  WHERE id = apartment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. Notification Triggers
-- ============================================

-- Notify owner on apartment status change (approved / rejected)
CREATE OR REPLACE FUNCTION notify_apartment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.owner_id,
      'تحديث حالة العقار',
      CASE 
        WHEN NEW.status = 'approved' THEN 'تمت الموافقة على عقارك: ' || NEW.title
        WHEN NEW.status = 'rejected' THEN 'تم رفض عقارك: ' || NEW.title
        ELSE 'تغيرت حالة عقارك: ' || NEW.title
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'danger'
        ELSE 'info'
      END,
      '/owner/apartments'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_apartment_status_change
  AFTER UPDATE OF status ON apartments
  FOR EACH ROW EXECUTE FUNCTION notify_apartment_status_change();

-- Notify owner on new review
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  apt_owner_id UUID;
  apt_title TEXT;
BEGIN
  SELECT owner_id, title INTO apt_owner_id, apt_title FROM apartments WHERE id = NEW.apartment_id;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    apt_owner_id,
    'تقييم جديد',
    'تمت إضافة تقييم جديد (' || NEW.rating || ' نجوم) على عقارك: ' || apt_title,
    'success',
    '/owner/apartment/' || NEW.apartment_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_new_review();

-- Notify receiver on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.receiver_id,
    'رسالة جديدة',
    'لديك رسالة جديدة من ' || COALESCE(sender_name, 'مستخدم'),
    'info',
    '/messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

