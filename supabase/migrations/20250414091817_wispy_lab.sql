/*
  # Update RLS Policies and Default Values

  1. Changes
    - Drop and recreate policies for all tables
    - Add proper constraints for notification templates
    - Insert default values with proper conflict handling
    - Enable RLS on all tables

  2. Security
    - Maintain admin access control
    - Allow read access for authenticated users
    - Preserve existing data
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- For settings table
  DROP POLICY IF EXISTS "Allow read access to all authenticated users for settings" ON settings;
  DROP POLICY IF EXISTS "Allow admin full access to settings" ON settings;

  -- For default_prices table
  DROP POLICY IF EXISTS "Allow read access to all authenticated users for prices" ON default_prices;
  DROP POLICY IF EXISTS "Allow admin full access to prices" ON default_prices;

  -- For notification_settings table
  DROP POLICY IF EXISTS "Allow read access to all authenticated users for notification settings" ON notification_settings;
  DROP POLICY IF EXISTS "Allow admin full access to notification settings" ON notification_settings;

  -- For notification_templates table
  DROP POLICY IF EXISTS "Allow read access to all authenticated users for notification templates" ON notification_templates;
  DROP POLICY IF EXISTS "Allow admin full access to notification templates" ON notification_templates;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
-- For settings table
CREATE POLICY "Allow read access to all authenticated users for settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- For default_prices table
CREATE POLICY "Allow read access to all authenticated users for prices"
  ON default_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to prices"
  ON default_prices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- For notification_settings table
CREATE POLICY "Allow read access to all authenticated users for notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to notification settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- For notification_templates table
CREATE POLICY "Allow read access to all authenticated users for notification templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to notification templates"
  ON notification_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure RLS is enabled on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Insert or update notification templates
DO $$
BEGIN
  -- Insert token_request_user template
  INSERT INTO notification_templates (type, message, delay, is_enabled)
  VALUES (
    'token_request_user',
    E'Hi, {{name}}. Thank you for your order.\nYou have made a Token Request {{amount}}.\n\nPlease make a payment of:\nRp {{price}} x {{amount}} token request = Rp {{total}}\n\nInvoice ini berlaku 1x24 jam. Segera lakukan pembayaran.\n\nStatus : Waiting Payment\n\nRekening pembayaran : {{bank_info}}',
    0,
    true
  )
  ON CONFLICT (type) DO UPDATE
  SET 
    message = EXCLUDED.message,
    delay = EXCLUDED.delay,
    is_enabled = EXCLUDED.is_enabled;

  -- Insert token_request_admin template
  INSERT INTO notification_templates (type, message, delay, is_enabled)
  VALUES (
    'token_request_admin',
    E'Hi, Admin PhotoProductAI.\n\nThere is a Token Request from {{user_email}}.\nRp {{price}} x {{amount}} token request = Rp {{total}}\n\nCek Admin Panel Pastikan sudah ada pembayaran',
    0,
    true
  )
  ON CONFLICT (type) DO UPDATE
  SET 
    message = EXCLUDED.message,
    delay = EXCLUDED.delay,
    is_enabled = EXCLUDED.is_enabled;

  -- Insert token_request_approved template
  INSERT INTO notification_templates (type, message, delay, is_enabled)
  VALUES (
    'token_request_approved',
    E'Hi, {{name}}.\n\nYour Request Accepted!\n\nToken Amount : {{amount}}\n\nStatus : Paid\n\nPlease login to your member area & check your dashboard',
    0,
    true
  )
  ON CONFLICT (type) DO UPDATE
  SET 
    message = EXCLUDED.message,
    delay = EXCLUDED.delay,
    is_enabled = EXCLUDED.is_enabled;

  -- Insert token_request_rejected template
  INSERT INTO notification_templates (type, message, delay, is_enabled)
  VALUES (
    'token_request_rejected',
    E'Hi, {{name}}.\n\nYour Request Rejected!\n\nToken Amount : {{amount}}\n\nStatus : Rejected.\n\nPlease contact admin for confirmation.',
    0,
    true
  )
  ON CONFLICT (type) DO UPDATE
  SET 
    message = EXCLUDED.message,
    delay = EXCLUDED.delay,
    is_enabled = EXCLUDED.is_enabled;
END $$;

-- Insert default notification settings if not exists
DO $$
BEGIN
  INSERT INTO notification_settings (sender_phone, api_key, is_enabled)
  SELECT '082231176609', 'b948bcee-12f1-4774-83fe-0573e3af247a', true
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_settings
  );
END $$;

-- Insert default payment info if not exists
DO $$
BEGIN
  INSERT INTO payment_info (bank_name, account_number, account_name)
  SELECT 'BCA', '1234567890', 'PT PHOTO PRODUCT AI'
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_info
  );
END $$;