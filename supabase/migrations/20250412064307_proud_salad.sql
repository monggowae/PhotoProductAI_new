/*
  # Sync Token Expiration Days

  1. Changes
    - Add int_value column to settings table
    - Creates a function to sync token_expiration days from JSONB to int_value
    - Adds a trigger to automatically sync on insert/update
    - Updates existing token_expiration records

  2. Details
    - Extracts days value from value->>'days'
    - Stores as integer in int_value column
    - Runs automatically on INSERT or UPDATE
*/

-- Add int_value column if it doesn't exist
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS int_value INTEGER;

-- Create the sync function
CREATE OR REPLACE FUNCTION sync_token_expiration_int_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.key = 'token_expiration' THEN
    NEW.int_value := (NEW.value->>'days')::int;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_token_expiration ON settings;

-- Create the trigger
CREATE TRIGGER sync_token_expiration
BEFORE INSERT OR UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION sync_token_expiration_int_value();

-- Update existing token_expiration records
UPDATE settings 
SET int_value = (value->>'days')::int
WHERE key = 'token_expiration'
  AND value ? 'days';