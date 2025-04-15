/*
  # Fix Settings Table Format

  1. Changes
    - Add int_value column to settings table
    - Update all settings to store numeric values properly
    - Create trigger to maintain int_value synchronization
    - Clean up value column format

  2. Details
    - Add int_value column if it doesn't exist
    - Extract numeric values from JSONB
    - Create trigger for automatic updates
*/

-- Add int_value column if it doesn't exist
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS int_value INTEGER;

-- Update service fees to correct format
UPDATE settings
SET value = jsonb_build_object(
  REPLACE(key, 'service_fees_', ''),
  (value->>REPLACE(key, 'service_fees_', ''))::int
)
WHERE key LIKE 'service_fees_%';

-- Update token_expiration
UPDATE settings
SET value = jsonb_build_object('days', (value->>'days')::int)
WHERE key = 'token_expiration';

-- Update other settings with amount
UPDATE settings
SET value = jsonb_build_object('amount', (value->>'amount')::int)
WHERE key IN ('minimum_token_request', 'minimum_balance', 'welcome_token');

-- Update int_value column from JSONB values
UPDATE settings
SET int_value = (
  CASE 
    WHEN key LIKE 'service_fees_%' THEN 
      (value->>REPLACE(key, 'service_fees_', ''))::int
    WHEN key = 'token_expiration' THEN 
      (value->>'days')::int
    ELSE 
      (value->>'amount')::int
  END
);

-- Create function to ensure proper format on insert/update
CREATE OR REPLACE FUNCTION update_int_value_from_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract the first numeric value from the JSONB
  SELECT COALESCE(
    (SELECT value::text::integer 
     FROM jsonb_each(NEW.value) 
     LIMIT 1),
    0
  ) INTO NEW.int_value;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain format
DROP TRIGGER IF EXISTS sync_int_value_with_jsonb ON settings;
CREATE TRIGGER sync_int_value_with_jsonb
  BEFORE INSERT OR UPDATE ON settings
  FOR EACH ROW
  WHEN (NEW.value IS NOT NULL)
  EXECUTE FUNCTION update_int_value_from_jsonb();