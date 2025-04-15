/*
  # Update handle_new_user function

  1. Changes
    - Use RETURNING to check if insert was successful
    - Improve welcome token handling
    - Better error handling and fallbacks
    - Proper timezone handling for Asia/Jakarta

  2. Details
    - Check for existing profile before insert
    - Get welcome_token and token_expiration from settings
    - Calculate expiration date in Asia/Jakarta timezone
    - Only add token history if insert succeeds
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  welcome_amount INTEGER;
  expiration_days INTEGER;
  expires_at TIMESTAMPTZ;
  inserted_id UUID;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

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

  -- Calculate expiration timestamp in Asia/Jakarta timezone
  expires_at := timezone('Asia/Jakarta', now()) + (expiration_days || ' days')::interval;

  -- Insert into profiles with welcome token balance and get the inserted ID
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
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO inserted_id;

  -- Only record welcome token if insert succeeded and welcome amount > 0
  IF inserted_id IS NOT NULL AND welcome_amount > 0 THEN
    INSERT INTO token_history (
      user_id,
      type,
      amount,
      expires_at,
      created_at
    ) VALUES (
      inserted_id,
      'welcome',
      welcome_amount,
      expires_at,
      timezone('Asia/Jakarta', now())
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;