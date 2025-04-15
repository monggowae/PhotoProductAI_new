/*
  # Add Phone Number to Profiles

  1. Changes
    - Add phone column to profiles table
    - Update handle_new_user function to store phone number
    - Add phone number to existing profiles table

  2. Details
    - Phone number is optional
    - Maintains existing data
    - Updates trigger function
*/

-- Add phone column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update handle_new_user function to include phone
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
  -- Get welcome token amount with fallback
  BEGIN
    SELECT COALESCE(int_value, 0)
    INTO welcome_amount
    FROM settings
    WHERE key = 'welcome_token';
  EXCEPTION
    WHEN OTHERS THEN
      welcome_amount := 0;
  END;

  -- Get expiration days with fallback
  BEGIN
    SELECT COALESCE(int_value, 5)
    INTO expiration_days
    FROM settings
    WHERE key = 'token_expiration';
  EXCEPTION
    WHEN OTHERS THEN
      expiration_days := 5;
  END;

  -- Calculate expiration timestamp
  expires_at := now() AT TIME ZONE 'Asia/Jakarta' + (expiration_days || ' days')::interval;

  -- Insert into profiles with welcome token balance and phone number
  INSERT INTO profiles (
    id,
    name,
    role,
    email,
    phone,
    api_tokens
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
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
      now() AT TIME ZONE 'Asia/Jakarta'
    );
  END IF;

  RETURN NEW;
END;
$$;