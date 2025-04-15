/*
  # Update settings to use proper JSONB format

  1. Changes
    - Update all settings to use proper JSONB objects
    - Set minimum_balance to {"amount": 55}
    - Set minimum_token_request to {"amount": 100}
    - Set token_expiration to {"days": 2}
    - Update service fees structure
*/

-- Update token expiration
UPDATE settings
SET value = '{"days": 2}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'token_expiration';

-- Update minimum token request
UPDATE settings
SET value = '{"amount": 100}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'minimum_token_request';

-- Update minimum balance
UPDATE settings
SET value = '{"amount": 55}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'minimum_balance';

-- Update service fees
UPDATE settings
SET value = '{
  "photo_product": 10,
  "food_photography": 5,
  "animal_photography": 5,
  "photo_modification": 4,
  "fashion_photography": 6
}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'service_fees';