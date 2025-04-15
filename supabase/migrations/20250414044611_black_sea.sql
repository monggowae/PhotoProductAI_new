/*
  # Add Notification Settings System

  1. New Tables
    - `notification_settings`
      - Global settings like API key and sender number
    - `notification_templates`
      - Message templates for different notification types
      - Configurable delay for each template

  2. Security
    - Enable RLS
    - Only admins can modify settings
    - All authenticated users can view settings
*/

-- Create notification_settings table
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_phone TEXT NOT NULL DEFAULT '',
  api_key TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_templates table
CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  delay INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_type CHECK (
    type IN (
      'signup',
      'token_request_user',
      'token_request_admin',
      'token_transfer_sender',
      'token_transfer_recipient',
      'token_request_pending',
      'token_request_approved',
      'token_request_rejected'
    )
  ),
  CONSTRAINT valid_delay CHECK (delay >= 0)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY "Allow read access to all authenticated users for settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to settings"
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

-- Create policies for notification_templates
CREATE POLICY "Allow read access to all authenticated users for templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to templates"
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

-- Create function to send WhatsApp notification
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
  phone_number TEXT,
  message_text TEXT,
  delay_seconds INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings notification_settings%ROWTYPE;
  api_url TEXT := 'https://api.starsender.online/api/send';
  payload JSONB;
BEGIN
  -- Get notification settings
  SELECT * INTO settings
  FROM notification_settings
  LIMIT 1;

  -- Check if notifications are enabled and we have required settings
  IF NOT FOUND OR NOT settings.is_enabled OR settings.api_key = '' THEN
    RETURN false;
  END IF;

  -- Prepare payload
  payload := jsonb_build_object(
    'messageType', 'text',
    'to', phone_number,
    'body', message_text,
    'delay', delay_seconds
  );

  -- Make API request using pg_net (this is a placeholder - actual implementation would use pg_net or similar)
  -- In practice, you would use pg_net or handle this in your edge functions
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create function to send notification based on template
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
  FOR var_key, var_value IN
    SELECT * FROM jsonb_each_text(variables)
  LOOP
    final_message := replace(final_message, '{{' || var_key || '}}', var_value);
  END LOOP;

  -- Send notification
  RETURN send_whatsapp_notification(phone_number, final_message, template.delay);
END;
$$;

-- Insert default templates
INSERT INTO notification_templates (type, message, delay)
VALUES
  ('signup', 'Welcome to PhotoProductAI! Your account has been created successfully. Start exploring our services now!', 0),
  ('token_request_user', 'Your token request for {{amount}} tokens has been submitted. We will process it shortly.', 0),
  ('token_request_admin', 'New token request: User {{user_email}} has requested {{amount}} tokens.', 0),
  ('token_transfer_sender', 'You have successfully sent {{amount}} tokens to {{recipient_email}}.', 0),
  ('token_transfer_recipient', 'You have received {{amount}} tokens from {{sender_email}}.', 5),
  ('token_request_pending', 'Your token request for {{amount}} tokens is pending approval.', 0),
  ('token_request_approved', 'Good news! Your token request for {{amount}} tokens has been approved.', 0),
  ('token_request_rejected', 'Your token request for {{amount}} tokens has been rejected. Please contact support for more information.', 0);

-- Insert default settings
INSERT INTO notification_settings (sender_phone, api_key, is_enabled)
VALUES ('', '', false);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();