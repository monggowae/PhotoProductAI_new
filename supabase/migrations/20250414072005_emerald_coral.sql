/*
  # Update Notification Templates

  1. Changes
    - Update token request templates with new message formats
    - Set default price to 200
    - Add proper variable handling for bank info
    - Update message formatting

  2. Details
    - User template includes payment details and bank info
    - Admin template includes request details
    - Proper formatting for currency values
*/

-- Update token request templates
UPDATE notification_templates
SET message = 
  CASE type
    WHEN 'token_request_user' THEN
      E'Hi, {{name}}. Thank you for your order.\n' ||
      E'You have made a Token Request {{amount}}.\n\n' ||
      E'Please make a payment of:\n' ||
      E'Rp 200 x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Invoice ini berlaku 1x24 jam. Segera lakukan pembayaran.\n\n' ||
      E'Status : Waiting Payment\n\n' ||
      E'Rekening pembayaran : {{bank_info}}'
    WHEN 'token_request_admin' THEN
      E'Hi, Admin PhotoProductAI.\n\n' ||
      E'There is a Token Request from {{user_email}}.\n' ||
      E'Rp 200 x {{amount}} token request = Rp {{total}}\n\n' ||
      E'Cek Admin Panel Pastikan sudah ada pembayaran'
    ELSE message
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE type IN ('token_request_user', 'token_request_admin');

-- Update send_notification_by_template function to handle price calculations
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
  token_price INTEGER := 200; -- Fixed price per token
  bank_info payment_info%ROWTYPE;
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

  -- Calculate total if amount is provided
  IF (variables->>'amount') IS NOT NULL THEN
    variables := variables || jsonb_build_object(
      'total', (variables->>'amount')::integer * token_price
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