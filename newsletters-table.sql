-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletters FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read newsletters"
  ON newsletters FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Unique index (prevents duplicate emails)
CREATE UNIQUE INDEX IF NOT EXISTS newsletters_email_idx ON newsletters (email);
