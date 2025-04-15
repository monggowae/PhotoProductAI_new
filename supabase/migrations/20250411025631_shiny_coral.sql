/*
  # Handle Duplicate Profiles

  1. Changes
    - Update handle_new_user function to use ON CONFLICT DO NOTHING
    - Add check for existing profile before insert
    - Ensure welcome tokens are only given once
    - Maintain error handling and security

  2. Security
    - Maintain SECURITY DEFINER
    - Keep search_path setting
    - Preserve existing RLS policies
*/

-- Update handle_new_user function
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
  existing_profile profiles%ROWTYPE;
BEGIN
  -- Check if profile already exists
  SELECT * INTO existing_profile
  FROM profiles
  WHERE id = NEW.id;

  -- If profile exists, just return
  IF FOUND THEN
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
  )
  ON CONFLICT (id) DO NOTHING;

  -- Only record welcome token if profile was actually created
  -- and welcome amount is greater than 0
  IF FOUND AND welcome_amount > 0 THEN
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
    -- Log error but don't fail the signup
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;