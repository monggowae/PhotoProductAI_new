/*
  # Split Service Fees into Individual Rows

  1. Changes
    - Split service_fees JSONB into individual rows
    - Each service gets its own row with proper key naming
    - Maintain value column
    - Preserve existing data

  2. Details
    - Create new rows for each service
    - Delete original service_fees row
    - Maintain proper JSONB structure
*/

DO $$ 
DECLARE
  service_fees_data JSONB;
  service_names TEXT[] := ARRAY['photo_product', 'food_photography', 'animal_photography', 'photo_modification', 'fashion_photography'];
  service_name TEXT;
BEGIN
  -- Get current service fees data
  SELECT value INTO service_fees_data
  FROM settings
  WHERE key = 'service_fees';

  -- Create individual rows for each service
  FOREACH service_name IN ARRAY service_names
  LOOP
    INSERT INTO settings (
      key,
      value,
      created_at,
      updated_at
    )
    VALUES (
      'service_fees_' || service_name,
      jsonb_build_object(service_name, service_fees_data->service_name),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  END LOOP;

  -- Delete the original service_fees row
  DELETE FROM settings WHERE key = 'service_fees';
END $$;