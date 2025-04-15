/*
  # Update Notification Templates and Add Payment Info

  1. Changes
    - Add payment_info table for bank account details
    - Update notification templates with new message formats
    - Add function to format currency amounts
    - Update token request templates with payment details

  2. Security
    - Enable RLS on payment_info table
    - Only admins can modify payment info
    - All authenticated users can view payment info
*/

-- Create payment_info table
CREATE TABLE payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_info
CREATE POLICY "Allow read access to all authenticated users for payment info"
  ON payment_info
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to payment info"
  ON payment_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_payment_info_updated_at
  BEFORE UPDATE ON payment_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to format currency
CREATE OR REPLACE FUNCTION format_currency(amount INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'Rp ' || to_char(amount::numeric, 'FM999,999,999');
END;
$$;

-- Insert default payment info
INSERT INTO payment_info (bank_name, account_number, account_name)
VALUES
  ('BCA', '1234567890', 'PT PHOTO PRODUCT AI');

-- Update notification templates with new message formats
UPDATE notification_templates
SET message = 
  CASE type
    WHEN 'token_request_user' THEN
      E'Hi, {{name}}. Thank you for your order.\n' ||
      E'You have made a Token Request {{amount}}.\n\n' ||
      E'Please make a payment of:\n' ||
      E'Rp {{price}} x {{amount}} token request = Rp {{total}}\n' ||
      E'**Invoice ini berlaku 1x24 jam. Segera lakukan pembayaran**\n' ||
      E'Status : Waiting Payment\n\n' ||
      E'Rekening pembayaran:\n' ||
      E'{{bank_info}}'
    WHEN 'token_request_admin' THEN
      E'Hi, Admin PhotoProductAI.\n' ||
      E'There is a Token Request from {{user_email}}.\n' ||
      E'Rp {{price}} x {{amount}} token request = Rp {{total}}\n' ||
      E'**Cek Admin Panel Pastikan sudah ada pembayaran**'
    WHEN 'token_request_approved' THEN
      E'Hi, {{name}}.\n' ||
      E'Your Request Accepted!\n' ||
      E'Token Amount : {{amount}}\n' ||
      E'Status : Paid\n' ||
      E'Please login to your member area & check your dashboard'
    WHEN 'token_request_rejected' THEN
      E'Hi, {{name}}.\n' ||
      E'Your Request Rejected!\n' ||
      E'Token Amount : {{amount}}\n' ||
      E'Status : Rejected.\n' ||
      E'Please contact admin for confirmation.'
    ELSE message
  END
WHERE type IN (
  'token_request_user',
  'token_request_admin',
  'token_request_approved',
  'token_request_rejected'
);

-- Function to get formatted bank info
CREATE OR REPLACE FUNCTION get_bank_info()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  info payment_info%ROWTYPE;
  formatted TEXT;
BEGIN
  SELECT * INTO info FROM payment_info LIMIT 1;
  IF NOT FOUND THEN
    RETURN '';
  END IF;

  formatted := info.bank_name || E'\n' ||
               'No. Rekening: ' || info.account_number || E'\n' ||
               'A/N: ' || info.account_name;
  
  RETURN formatted;
END;
$$;

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
  token_price INTEGER := 10000; -- Price per token in Rupiah
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

  -- Replace variables in message
  final_message := template.message;

  -- Add price calculations for token requests
  IF template_type LIKE 'token_request%' THEN
    variables := variables || jsonb_build_object(
      'price', format_currency(token_price),
      'total', format_currency(token_price * (variables->>'amount')::integer)
    );

    -- Add bank info for user requests
    IF template_type = 'token_request_user' THEN
      variables := variables || jsonb_build_object(
        'bank_info', get_bank_info()
      );
    END IF;
  END IF;

  -- Replace all variables
  FOR var_key, var_value IN
    SELECT * FROM jsonb_each_text(variables)
  LOOP
    final_message := replace(final_message, '{{' || var_key || '}}', var_value);
  END LOOP;

  -- Send notification
  RETURN send_whatsapp_notification(phone_number, final_message, template.delay);
END;
$$;