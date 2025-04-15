/*
  # Token Request Validation Settings

  1. Changes
    - Update minimum_token_request setting to ensure proper JSONB format
    - Add validation function for token requests
    - Add trigger to validate token requests before insert

  2. Security
    - Function is set as SECURITY DEFINER to run with elevated privileges
    - Validation runs automatically via trigger
*/

-- Ensure minimum_token_request has proper JSONB format
UPDATE settings
SET value = '{"amount": 100}'::jsonb
WHERE key = 'minimum_token_request'
AND (value->>'amount') IS NULL;

-- Create validation function
CREATE OR REPLACE FUNCTION validate_token_request()
RETURNS trigger AS $$
DECLARE
  min_amount INTEGER;
BEGIN
  -- Get minimum token request amount from settings
  SELECT (value->>'amount')::integer INTO min_amount
  FROM settings
  WHERE key = 'minimum_token_request';

  -- If setting doesn't exist, use default value
  IF min_amount IS NULL THEN
    min_amount := 10;
  END IF;

  -- Validate amount
  IF NEW.amount < min_amount THEN
    RAISE EXCEPTION 'Token request amount must be at least %', min_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for validation
DO $$ BEGIN
  CREATE TRIGGER validate_token_request_trigger
    BEFORE INSERT OR UPDATE ON token_requests
    FOR EACH ROW
    EXECUTE FUNCTION validate_token_request();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;