/*
  # Ensure Token Settings for Users

  1. Changes
    - Add default settings for all token-related configurations
    - Ensure service fees are properly set for all services
    - Set reasonable default values for token operations
*/

-- Insert default settings if they don't exist
DO $$ 
BEGIN
  -- Token expiration setting
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'token_expiration') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('token_expiration', '{"days": 7}', 7);
  END IF;

  -- Minimum token request
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'minimum_token_request') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('minimum_token_request', '{"amount": 10}', 10);
  END IF;

  -- Minimum balance for transfers
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'minimum_balance') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('minimum_balance', '{"amount": 5}', 5);
  END IF;

  -- Service fees
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_photo_product') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_photo_product', '{"fee": 5}', 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_fashion_photography') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_fashion_photography', '{"fee": 6}', 6);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_animal_photography') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_animal_photography', '{"fee": 5}', 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_food_photography') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_food_photography', '{"fee": 5}', 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_photo_modification') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_photo_modification', '{"fee": 4}', 4);
  END IF;
END $$;