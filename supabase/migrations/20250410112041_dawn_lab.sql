/*
  # Add settings table and functions

  1. New Tables
    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting identifier
      - `value` (jsonb) - Setting value
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Initial Settings
    - Token expiration
    - Minimum token request
    - Minimum balance for transfers
    - Service fees for each tool

  3. Security
    - Enable RLS
    - Only admins can modify settings
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Allow admin full access" ON settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('token_expiration', '{"days": 2}'::jsonb),
  ('minimum_token_request', '{"amount": 10}'::jsonb),
  ('minimum_balance', '{"amount": 20}'::jsonb),
  ('service_fees', '{
    "photo_product": 5,
    "fashion_photography": 6,
    "animal_photography": 5,
    "photo_modification": 4,
    "food_photography": 5
  }'::jsonb);

-- Function to update settings
CREATE OR REPLACE FUNCTION update_setting(
  setting_key text,
  new_value jsonb
) RETURNS void AS $$
BEGIN
  UPDATE settings
  SET 
    value = new_value,
    updated_at = CURRENT_TIMESTAMP
  WHERE key = setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();