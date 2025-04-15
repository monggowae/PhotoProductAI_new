/*
  # Update settings values

  Updates the values in the settings table to match the specified configuration:
  1. Token expiration: 2 days
  2. Minimum token request: 101 tokens
  3. Minimum balance: 55 tokens
  4. Service fees:
     - photo_product: 10
     - food_photography: 5
     - Other services remain unchanged
*/

-- Update token expiration
UPDATE settings
SET value = '{"days": 2}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'token_expiration';

-- Update minimum token request
UPDATE settings
SET value = '{"amount": 101}'::jsonb,
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
  "fashion_photography": 6,
  "animal_photography": 5,
  "photo_modification": 4,
  "food_photography": 5
}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'service_fees';