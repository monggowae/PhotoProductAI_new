/*
  # Add Welcome Token Functionality

  1. Changes
    - Add welcome_token setting if not exists
    - Update handle_new_user function to:
      * Add welcome tokens to new users
      * Record token history
      * Set proper expiration based on settings

  2. Features
    - Reads welcome token amount from settings
    - Reads expiration days from settings
    - Adds tokens to user's balance
    - Records in token history
    - Handles missing settings gracefully
*/

-- Create or update welcome_token setting
DO $$ 
BEGIN
  INSERT INTO settings (key, value, int_value)
  VALUES ('welcome_token', '{"amount": 7}'::jsonb, 7)
  ON CONFLICT (key) DO UPDATE 
  SET value = '{"amount": 7}'::jsonb,
      int_value = 7;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  welcome_amount INTEGER;
  expiration_days INTEGER;
  expires_at TIMESTAMPTZ;
BEGIN
  -- Get welcome token amount with fallback
  BEGIN
    SELECT COALESCE(
      (value->>'amount')::int,
      int_value,
      0
    ) INTO welcome_amount
    FROM settings
    WHERE key = 'welcome_token';
  EXCEPTION
    WHEN OTHERS THEN
      welcome_amount := 0;
  END;

  -- Get expiration days with fallback
  BEGIN
    SELECT COALESCE(
      (value->>'days')::int,
      int_value,
      5
    ) INTO expiration_days
    FROM settings
    WHERE key = 'token_expiration';
  EXCEPTION
    WHEN OTHERS THEN
      expiration_days := 5;
  END;

  -- Calculate expiration timestamp
  expires_at := timezone('Asia/Jakarta', now()) + (expiration_days || ' days')::interval;

  -- Insert into profiles with welcome token balance
  INSERT INTO profiles (
    id,
    name,
    role,
    email,
    api_tokens
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    NEW.email,
    welcome_amount
  );

  -- Record welcome token in history if amount > 0
  IF welcome_amount > 0 THEN
    INSERT INTO token_history (
      user_id,
      type,
      amount,
      expires_at,
      created_at
    ) VALUES (
      NEW.id,
      'welcome',
      welcome_amount,
      expires_at,
      timezone('Asia/Jakarta', now())
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error if needed but continue
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Ensure the type column in token_history accepts 'welcome'
DO $$ 
BEGIN
  ALTER TABLE token_history 
    DROP CONSTRAINT IF EXISTS token_history_type_check;
  
  ALTER TABLE token_history
    ADD CONSTRAINT token_history_type_check 
    CHECK (type IN ('approved', 'transferred_in', 'transferred_out', 'expired', 'welcome'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;