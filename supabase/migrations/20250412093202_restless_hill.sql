/*
  # Update Settings Values

  1. Changes
    - Update welcome token amount to 15
    - Update token expiration to 30 days
    - Update minimum token request to 50
    - Update minimum balance to 27
    - Update service fees:
      * Photo Product: 5
      * Fashion Photography: 6
      * Animal Photography: 7
      * Food Photography: 8
      * Photo Modification: 9

  2. Details
    - Updates both value and int_value columns
    - Maintains proper JSONB structure
    - Uses proper error handling
*/

-- Update welcome token
UPDATE settings
SET 
  value = '{"amount": 15}'::jsonb,
  int_value = 15
WHERE key = 'welcome_token';

-- Update token expiration
UPDATE settings
SET 
  value = '{"days": 30}'::jsonb,
  int_value = 30
WHERE key = 'token_expiration';

-- Update minimum token request
UPDATE settings
SET 
  value = '{"amount": 50}'::jsonb,
  int_value = 50
WHERE key = 'minimum_token_request';

-- Update minimum balance
UPDATE settings
SET 
  value = '{"amount": 27}'::jsonb,
  int_value = 27
WHERE key = 'minimum_balance';

-- Update service fees
UPDATE settings
SET 
  value = '{"fee": 5}'::jsonb,
  int_value = 5
WHERE key = 'service_fees_photo_product';

UPDATE settings
SET 
  value = '{"fee": 6}'::jsonb,
  int_value = 6
WHERE key = 'service_fees_fashion_photography';

UPDATE settings
SET 
  value = '{"fee": 7}'::jsonb,
  int_value = 7
WHERE key = 'service_fees_animal_photography';

UPDATE settings
SET 
  value = '{"fee": 8}'::jsonb,
  int_value = 8
WHERE key = 'service_fees_food_photography';

UPDATE settings
SET 
  value = '{"fee": 9}'::jsonb,
  int_value = 9
WHERE key = 'service_fees_photo_modification';

-- Insert any missing settings with default values
DO $$ 
BEGIN
  -- Welcome token
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'welcome_token') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('welcome_token', '{"amount": 15}', 15);
  END IF;

  -- Token expiration
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'token_expiration') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('token_expiration', '{"days": 30}', 30);
  END IF;

  -- Minimum token request
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'minimum_token_request') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('minimum_token_request', '{"amount": 50}', 50);
  END IF;

  -- Minimum balance
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'minimum_balance') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('minimum_balance', '{"amount": 27}', 27);
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
    VALUES ('service_fees_animal_photography', '{"fee": 7}', 7);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_food_photography') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_food_photography', '{"fee": 8}', 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'service_fees_photo_modification') THEN
    INSERT INTO settings (key, value, int_value)
    VALUES ('service_fees_photo_modification', '{"fee": 9}', 9);
  END IF;
END $$;