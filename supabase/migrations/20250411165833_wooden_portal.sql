/*
  # Fix Minimum Balance in Transfer Function

  1. Changes
    - Update transfer_tokens function to read minimum_balance from settings
    - Remove hardcoded minimum balance value
    - Add fallback if setting is not found

  2. Details
    - Uses settings table for minimum balance configuration
    - Maintains consistent balance requirements across the application
    - Improves maintainability by centralizing configuration
*/

-- Update transfer_tokens function to use settings
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
  min_balance INTEGER;
BEGIN
  -- Get minimum balance from settings
  SELECT COALESCE(int_value, 5)
  INTO min_balance
  FROM settings
  WHERE key = 'minimum_balance';

  -- Get sender profile
  SELECT * INTO sender_profile
  FROM profiles
  WHERE id = auth.uid();

  -- Get recipient profile
  SELECT * INTO recipient_profile
  FROM profiles
  WHERE email = recipient_email;

  -- Validate transfer
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

  -- Perform transfer
  UPDATE profiles
  SET api_tokens = api_tokens - transfer_amount
  WHERE id = sender_profile.id;

  UPDATE profiles
  SET api_tokens = api_tokens + transfer_amount
  WHERE id = recipient_profile.id;

  -- Record transfer
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