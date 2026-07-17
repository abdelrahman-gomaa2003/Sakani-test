-- =====================================================
-- SAKANI: Subscriptions System (Production-Ready)
-- =====================================================
-- Plan Limits:
--   Free:         3 apartments, 5 images each
--   Premium:     10 apartments, 15 images each  (50 EGP/month)
--   Professional: unlimited                      (100 EGP/month)
-- =====================================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium', 'professional')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sub_owner ON subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_sub_owner_status ON subscriptions(owner_id, status);

-- 3. RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can view their own subscriptions
CREATE POLICY "sub_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = owner_id);

-- Owners can insert their own subscriptions
CREATE POLICY "sub_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Admins can view ALL subscriptions
CREATE POLICY "sub_select_admin" ON subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update ALL subscriptions
CREATE POLICY "sub_update_admin" ON subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete subscriptions
CREATE POLICY "sub_delete_admin" ON subscriptions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Function to auto-expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- WEBHOOK CONFIGURATION (for Paymob)
-- =====================================================
-- Sandbox webhook URL:
--   POST https://localhost:3001/api/payments/webhook
--
-- Live webhook URL:
--   POST https://your-domain.com/api/payments/webhook
--
-- Configure in Paymob Dashboard:
--   Settings > Webhooks > Payment Updated > Add URL
-- =====================================================
