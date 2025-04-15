/*
  # Update Notification Templates and Functions

  1. Changes
    - Update notification templates with proper variable formatting
    - Add function to format numbers with thousand separator
    - Update send_notification_by_template function to handle all variables
    - Add proper price formatting from default_prices table

  2. Features
    - Proper thousand separator for numbers
    - Dynamic price from settings
    - Bank info from payment_info table
    - User info from profiles table
*/

-- Create function to format number with thousand separator
CREATE OR REPLACE FUNCTION format_number(num INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN replace(
    to_char(num, '999,999,999'),
    ',',
    '.'
  );
END;
$$;

-- Update notification templates with proper formatting
UPDATE notification_templates
SET message = 
  CASE type
    WHEN 'token_request_user' THEN
      E'Hi, {{name}}. Thank you for your order.\n' ||
      E'You have made a Token Request {{amount}}.\n\n' ||
      E'Please make a payment of:\n' ||
      E'Rp {{price}} x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Invoice ini berlaku 1x24 jam. Segera lakukan pembayaran.\n\n' ||
      E'Status : Waiting Payment\n\n' ||
      E'Rekening pembayaran : {{bank_info}}'
    WHEN 'token_request_admin' THEN
      E'Hi, Admin PhotoProductAI.\n\n' ||
      E'There is a Token Request from {{user_email}}.\n' ||
      E'Rp {{price}} x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Cek Admin Panel Pastikan sudah ada pembayaran'
    ELSE message
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE type IN ('token_request_user', 'token_request_admin');

-- Update send_notification_by_template function
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

  -- Get current token price
  SELECT amount INTO token_price
  FROM default_prices
  WHERE name = 'token_price'
  AND is_active = true;

  IF NOT FOUND THEN
    token_price := 200; -- Default fallback price
  END IF;

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

-- Update default token price if needed
UPDATE default_prices
SET amount = 200
WHERE name = 'token_price'
AND amount != 200;

-- Insert default token price if not exists
INSERT INTO default_prices (name, amount, description)
VALUES ('token_price', 200, 'Price per token in Rupiah')
ON CONFLICT (name) DO NOTHING;