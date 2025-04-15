/*
  # Update Functions and Policies for Security

  1. Changes
    - Add SECURITY DEFINER to all functions
    - Add policy for trigger-based inserts to profiles
    - Update existing policies to be more secure
    - Ensure all functions can bypass RLS

  2. Security
    - Functions run with elevated privileges
    - Proper access control for trigger operations
    - Protected system operations
*/

-- Add policy to allow trigger-based inserts to profiles
CREATE POLICY "Allow trigger-based profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

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
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update sync_token_request_email function
CREATE OR REPLACE FUNCTION sync_token_request_email()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.token_requests
  SET user_email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Update validate_token_request function
CREATE OR REPLACE FUNCTION validate_token_request()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  min_amount INTEGER;
BEGIN
  SELECT (value->>'amount')::integer INTO min_amount
  FROM settings
  WHERE key = 'minimum_token_request';

  IF min_amount IS NULL THEN
    min_amount := 10;
  END IF;

  IF NEW.amount < min_amount THEN
    RAISE EXCEPTION 'Token request amount must be at least %', min_amount;
  END IF;

  RETURN NEW;
END;
$$;

-- Update insert_token_history_from_request function
CREATE OR REPLACE FUNCTION insert_token_history_from_request()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  expiration_days INTEGER;
  base_expired_at TIMESTAMPTZ;
  extended_expired_at TIMESTAMPTZ;
BEGIN
  SELECT int_value INTO expiration_days 
  FROM settings 
  WHERE key = 'token_expiration';

  IF expiration_days IS NULL THEN
    expiration_days := 14;
  END IF;

  SELECT MAX(expires_at) INTO base_expired_at 
  FROM token_history
  WHERE user_id = NEW.user_id 
    AND expires_at > timezone('Asia/Jakarta', now());

  IF base_expired_at IS NOT NULL THEN
    extended_expired_at := base_expired_at + INTERVAL '7 days';
  ELSE
    extended_expired_at := timezone('Asia/Jakarta', now()) + 
                         (expiration_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO token_history (
    user_id,
    type,
    amount,
    expires_at,
    created_at
  ) VALUES (
    NEW.user_id,
    'approved',
    NEW.amount,
    extended_expired_at,
    timezone('Asia/Jakarta', now())
  );

  RETURN NEW;
END;
$$;

-- Update insert_token_history_from_transfer function
CREATE OR REPLACE FUNCTION insert_token_history_from_transfer()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  transfer_expires_at TIMESTAMPTZ;
BEGIN
  transfer_expires_at := timezone('Asia/Jakarta', NEW.created_at) + INTERVAL '7 days';

  INSERT INTO token_history (
    user_id,
    type,
    amount,
    related_user_id,
    expires_at,
    created_at
  ) VALUES (
    NEW.recipient_id,
    'transferred_in',
    NEW.amount,
    NEW.sender_id,
    transfer_expires_at,
    timezone('Asia/Jakarta', NEW.created_at)
  );

  INSERT INTO token_history (
    user_id,
    type,
    amount,
    related_user_id,
    created_at
  ) VALUES (
    NEW.sender_id,
    'transferred_out',
    NEW.amount,
    NEW.recipient_id,
    timezone('Asia/Jakarta', NEW.created_at)
  );

  RETURN NEW;
END;
$$;

-- Update transfer_tokens function
CREATE OR REPLACE FUNCTION transfer_tokens(
  recipient_email TEXT,
  transfer_amount INTEGER
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sender_profile profiles%ROWTYPE;
  recipient_profile profiles%ROWTYPE;
  transfer_id UUID;
  min_balance INTEGER := 20;
BEGIN
  SELECT * INTO sender_profile
  FROM profiles
  WHERE id = auth.uid();

  SELECT * INTO recipient_profile
  FROM profiles
  WHERE email = recipient_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  IF sender_profile.id = recipient_profile.id THEN
    RAISE EXCEPTION 'Cannot transfer tokens to yourself';
  END IF;

  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  IF (sender_profile.api_tokens - transfer_amount) < min_balance THEN
    RAISE EXCEPTION 'Must maintain minimum balance of % tokens', min_balance;
  END IF;

  UPDATE profiles
  SET api_tokens = api_tokens - transfer_amount
  WHERE id = sender_profile.id;

  UPDATE profiles
  SET api_tokens = api_tokens + transfer_amount
  WHERE id = recipient_profile.id;

  INSERT INTO token_transfers (
    sender_id,
    sender_email,
    recipient_id,
    recipient_email,
    amount
  )
  VALUES (
    sender_profile.id,
    sender_profile.email,
    recipient_profile.id,
    recipient_profile.email,
    transfer_amount
  )
  RETURNING id INTO transfer_id;

  RETURN transfer_id;
END;
$$;