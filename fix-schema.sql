-- ============================================
-- Sakani - Fix Script
-- شغّل هذا الاستعلام إذا واجهت مشاكل بعد الإعداد الأولي
-- ============================================

-- 1. إعادة إنشاء التريجر
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. إعادة إنشاء RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. تأكد إن كل المستخدمين الحاليين عندهم profiles
-- شغّل هذا لتشوف المستخدمين اللي ماعندهمش profile:
-- SELECT au.id, au.email FROM auth.users au LEFT JOIN profiles p ON au.id = p.id WHERE p.id IS NULL;

-- 4. لو في مستخدمين ماعندهمش profile، أضفهم يدوياً:
-- INSERT INTO profiles (id, full_name, email, role)
-- SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', au.email), au.email, COALESCE(au.raw_user_meta_data->>'role', 'student')
-- FROM auth.users au LEFT JOIN profiles p ON au.id = p.id WHERE p.id IS NULL;
