/*
  # Add Default Prices Table

  1. New Tables
    - `default_prices`
      - `id` (uuid, primary key)
      - `name` (text) - Price identifier
      - `amount` (integer) - Price amount in Rupiah
      - `description` (text) - Price description
      - `is_active` (boolean) - Whether this price is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Only admins can modify prices
    - All authenticated users can read prices
    - Add function to safely update prices

  3. Initial Data
    - Add default token price
*/

-- Create default_prices table
CREATE TABLE default_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE default_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
  ON default_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access"
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

-- Create function to update price
CREATE OR REPLACE FUNCTION update_default_price(
  price_name TEXT,
  new_amount INTEGER,
  new_description TEXT DEFAULT NULL
)
RETURNS default_prices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_price default_prices;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update prices';
  END IF;

  -- Validate amount
  IF new_amount < 0 THEN
    RAISE EXCEPTION 'Price amount cannot be negative';
  END IF;

  -- Update price
  UPDATE default_prices
  SET 
    amount = new_amount,
    description = COALESCE(new_description, description),
    updated_at = CURRENT_TIMESTAMP
  WHERE name = price_name
  RETURNING * INTO updated_price;

  IF NOT FOUND THEN
    INSERT INTO default_prices (name, amount, description)
    VALUES (price_name, new_amount, new_description)
    RETURNING * INTO updated_price;
  END IF;

  RETURN updated_price;
END;
$$;

-- Create function to get price
CREATE OR REPLACE FUNCTION get_default_price(price_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  price_amount INTEGER;
BEGIN
  SELECT amount INTO price_amount
  FROM default_prices
  WHERE name = price_name
  AND is_active = true;

  RETURN COALESCE(price_amount, 0);
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_default_prices_updated_at
  BEFORE UPDATE ON default_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default prices
INSERT INTO default_prices (name, amount, description)
VALUES 
  ('token_price', 200, 'Default price per token'),
  ('minimum_token_request', 100, 'Minimum number of tokens that can be requested'),
  ('minimum_balance', 50, 'Minimum token balance that must be maintained');

-- Update notification template function to use default price
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
  token_price := get_default_price('token_price');

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
      'price', token_price::text,
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