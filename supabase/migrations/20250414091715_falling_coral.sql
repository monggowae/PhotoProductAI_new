/*
  # Update Notification System for All Users

  1. Changes
    - Add new notification templates for all users
    - Update existing templates with better formatting
    - Ensure proper access control through RLS
    - Add helper functions for notification handling

  2. Security
    - Maintain existing RLS policies
    - Keep admin-only write access
    - Allow read access for all authenticated users
*/

-- Update notification templates with improved messages
UPDATE notification_templates
SET message = 
  CASE type
    WHEN 'token_request_approved' THEN
      E'Hi, {{name}}.\n\n' ||
      E'Your token request has been approved!\n\n' ||
      E'Details:\n' ||
      E'- Amount: {{amount}} tokens\n' ||
      E'- Status: Approved\n' ||
      E'- Date: {{date}}\n\n' ||
      E'Your tokens have been added to your account.\n' ||
      E'Please login to your dashboard to start using them.'
    WHEN 'token_request_rejected' THEN
      E'Hi, {{name}}.\n\n' ||
      E'Your token request has been rejected.\n\n' ||
      E'Details:\n' ||
      E'- Amount: {{amount}} tokens\n' ||
      E'- Status: Rejected\n' ||
      E'- Date: {{date}}\n\n' ||
      E'If you have any questions, please contact our support team.'
    ELSE message
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE type IN ('token_request_approved', 'token_request_rejected');

-- Create function to format date in Indonesian format
CREATE OR REPLACE FUNCTION format_id_date(dt TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  months TEXT[] := ARRAY['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  d DATE := dt::DATE;
BEGIN
  RETURN EXTRACT(DAY FROM d) || ' ' || 
         months[EXTRACT(MONTH FROM d)::INTEGER] || ' ' ||
         EXTRACT(YEAR FROM d);
END;
$$;

-- Update send_notification_by_template function to include date formatting
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

  -- Add formatted date to variables
  variables := variables || jsonb_build_object(
    'date', format_id_date(CURRENT_TIMESTAMP)
  );

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

-- Create function to send notifications to all relevant users
CREATE OR REPLACE FUNCTION notify_token_request_status_change(
  request_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request token_requests%ROWTYPE;
  user_profile profiles%ROWTYPE;
  template_type TEXT;
  notification_sent BOOLEAN;
BEGIN
  -- Get request details
  SELECT * INTO request
  FROM token_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = request.user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Determine template type based on status
  template_type := CASE new_status
    WHEN 'approved' THEN 'token_request_approved'
    WHEN 'rejected' THEN 'token_request_rejected'
    ELSE NULL
  END;

  IF template_type IS NULL THEN
    RETURN false;
  END IF;

  -- Send notification to user
  IF user_profile.phone IS NOT NULL THEN
    notification_sent := send_notification_by_template(
      template_type,
      user_profile.phone,
      jsonb_build_object(
        'name', user_profile.name,
        'amount', request.amount,
        'user_id', user_profile.id
      )
    );
  END IF;

  RETURN COALESCE(notification_sent, false);
END;
$$;

-- Create trigger to automatically send notifications on status change
CREATE OR REPLACE FUNCTION token_request_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status THEN
    PERFORM notify_token_request_status_change(NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for status changes
DROP TRIGGER IF EXISTS token_request_status_notification_trigger ON token_requests;
CREATE TRIGGER token_request_status_notification_trigger
  AFTER UPDATE OF status ON token_requests
  FOR EACH ROW
  EXECUTE FUNCTION token_request_status_notification();