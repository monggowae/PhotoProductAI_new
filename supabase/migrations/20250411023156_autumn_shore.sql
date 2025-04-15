/*
  # Add Welcome Token Setting

  1. Changes
    - Add welcome_token setting to settings table
    - Update handle_new_user function to grant welcome tokens
    - Add welcome token to token history

  2. Features
    - Configurable welcome token amount
    - Automatic token grant on registration
    - Proper token history tracking
*/

-- Add welcome token setting if it doesn't exist
INSERT INTO settings (key, value)
VALUES ('welcome_token', '{"amount": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Update handle_new_user function to include welcome token
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  welcome_amount INTEGER;
  expiration_days INTEGER;
  expires_at TIMESTAMPTZ;
BEGIN
  -- Get welcome token amount
  SELECT COALESCE((value->>'amount')::int, 5)
  INTO welcome_amount
  FROM settings
  WHERE key = 'welcome_token';

  -- Get token expiration days
  SELECT COALESCE(int_value, 14)
  INTO expiration_days
  FROM settings
  WHERE key = 'token_expiration';

  -- Calculate expiration date
  expires_at := timezone('Asia/Jakarta', now()) + (expiration_days || ' days')::interval;

  -- Create profile with welcome tokens
  INSERT INTO public.profiles (
    id,
    name,
    role,
    email,
    api_tokens
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    NEW.email,
    welcome_amount
  );

  -- Record welcome token in history
  IF welcome_amount > 0 THEN
    INSERT INTO token_history (
      user_id,
      type,
      amount,
      expires_at,
      created_at
    ) VALUES (
      NEW.id,
      'approved',
      welcome_amount,
      expires_at,
      timezone('Asia/Jakarta', now())
    );
  END IF;

  RETURN NEW;
END;
$$ language plpgsql security definer;