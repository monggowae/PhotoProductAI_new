/*
  # Update Token Price and Access Policies

  1. Changes
    - Update token price to 300
    - Ensure all authenticated users can read settings
    - Update notification templates with new price
    - Maintain existing policies

  2. Security
    - Read access for authenticated users
    - Write access remains admin-only
*/

-- Update token price to 300
UPDATE default_prices
SET 
  amount = 300,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'token_price';

-- Update notification templates to reflect new price
UPDATE notification_templates
SET message = 
  CASE type
    WHEN 'token_request_user' THEN
      E'Hi, {{name}}. Thank you for your order.\n' ||
      E'You have made a Token Request {{amount}}.\n\n' ||
      E'Please make a payment of:\n' ||
      E'Rp 300 x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Invoice ini berlaku 1x24 jam. Segera lakukan pembayaran.\n\n' ||
      E'Status : Waiting Payment\n\n' ||
      E'Rekening pembayaran : {{bank_info}}'
    WHEN 'token_request_admin' THEN
      E'Hi, Admin PhotoProductAI.\n\n' ||
      E'There is a Token Request from {{user_email}}.\n' ||
      E'Rp 300 x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Cek Admin Panel Pastikan sudah ada pembayaran'
    ELSE message
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE type IN ('token_request_user', 'token_request_admin');

-- Ensure RLS is enabled on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for read access
CREATE POLICY "Allow read access to all authenticated users for settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users for prices"
  ON default_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users for notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users for notification templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Update send_notification_by_template function to use default_prices
CREATE OR REPLACE FUNCTION send_notification_by_template(
  template_type TEXT,
  phone_number TEXT,
  variables JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template notification_templates%ROWTYPE;
  final_message TEXT;
  var_key TEXT;
  var_value TEXT;
  token_price INTEGER;
  bank_info payment_info%ROWTYPE;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get template
  SELECT * INTO template
  FROM notification_templates
  WHERE type = template_type
  AND is_enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get current token price from default_prices
  SELECT amount INTO token_price
  FROM default_prices
  WHERE name = 'token_price'
  AND is_active = true;

  IF NOT FOUND THEN
    token_price := 300; -- Default fallback price
  END IF;

  -- Add formatted date to variables
  variables := variables || jsonb_build_object(
    'date', format_id_date(CURRENT_TIMESTAMP)
  );

  -- Get user profile if user_id is provided
  IF (variables->>'user_id') IS NOT NULL THEN
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = (variables->>'user_id')::uuid;

    IF FOUND THEN
      variables := variables || jsonb_build_object(
        'name', user_profile.name,
        'user_email', user_profile.email
      );
    END IF;
  END IF;

  -- Get bank info for user requests
  IF template_type = 'token_request_user' THEN
    SELECT * INTO bank_info FROM payment_info LIMIT 1;
    IF FOUND THEN
      variables := variables || jsonb_build_object(
        'bank_info',
        bank_info.bank_name || ' ' || bank_info.account_number || ' a.n ' || bank_info.account_name
      );
    END IF;
  END IF;

  -- Calculate and format price/total if amount is provided
  IF (variables->>'amount') IS NOT NULL THEN
    variables := variables || jsonb_build_object(
      'price', format_number(token_price),
      'total', format_number((variables->>'amount')::integer * token_price)
    );
  END IF;

  -- Replace all variables in message
  final_message := template.message;
  FOR var_key, var_value IN
    SELECT * FROM jsonb_each_text(variables)
  LOOP
    final_message := replace(final_message, '{{' || var_key || '}}', var_value);
  END LOOP;

  -- Send notification
  RETURN send_whatsapp_notification(phone_number, final_message, template.delay);
END;
$$;