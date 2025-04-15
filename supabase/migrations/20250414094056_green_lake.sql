/*
  # Update Token Price to 300

  1. Changes
    - Update token price in default_prices table
    - Update notification templates to use new price
    - Update notification functions to use new price

  2. Details
    - Sets token price to 300 in all relevant places
    - Maintains proper formatting and calculations
    - Updates all notification messages
*/

-- Update token price to 300
UPDATE default_prices
SET 
  amount = 300,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'token_price';

-- Insert if not exists
INSERT INTO default_prices (name, amount, description)
SELECT 
  'token_price',
  300,
  'Price per token in Rupiah'
WHERE NOT EXISTS (
  SELECT 1 FROM default_prices WHERE name = 'token_price'
);

-- Update notification templates to use new price
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

-- Update send_notification_by_template function to use new default price
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