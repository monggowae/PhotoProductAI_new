/*
  # Add default service fee setting

  1. Changes
    - Insert default service fee for animal photography if it doesn't exist
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM settings 
    WHERE key = 'service_fees_animal_photography'
  ) THEN
    INSERT INTO settings (key, value, int_value)
    VALUES (
      'service_fees_animal_photography',
      '{"fee": 5}',
      5
    );
  END IF;
END $$;