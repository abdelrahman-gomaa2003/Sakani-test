-- ============================================
-- Sakani - Add special_reference to payments
-- شغّل هذا الاستعلام إذا كنت شغّلت add-payments-table.sql سابقاً
-- ============================================

-- Add special_reference column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'special_reference'
  ) THEN
    ALTER TABLE payments ADD COLUMN special_reference TEXT;
  END IF;
END $$;

-- Fix CHECK constraint to include subscription types
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_type_check
  CHECK (type IN ('featured_ad', 'premium_listing', 'broker_monthly', 'subscription_premium', 'subscription_professional'));
