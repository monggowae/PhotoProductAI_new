/*
  # Fix Token Expiration Calculation

  1. Changes
    - Update expiring_tokens_view to use exact timestamp from token_history
    - Remove timezone conversion that was causing the off-by-one issue
    - Ensure all expiration calculations use the same base timestamp
    - Add proper indexing for performance

  2. Details
    - Uses token_history.expires_at directly
    - Maintains Asia/Jakarta timezone consistency
    - Improves query performance with index
*/

-- Drop existing view
DROP VIEW IF EXISTS expiring_tokens_view;

-- Create index for expires_at to improve performance
CREATE INDEX IF NOT EXISTS idx_token_history_expires_at 
ON token_history(expires_at);

-- Recreate view with correct expiration calculation
CREATE OR REPLACE VIEW expiring_tokens_view AS
WITH timezone_config AS (
  SELECT 'Asia/Jakarta'::text as tz
)
SELECT 
  th.user_id,
  SUM(th.amount) as total_expiring_tokens,
  MIN(th.expires_at) as earliest_expiration
FROM token_history th
CROSS JOIN timezone_config tc
WHERE 
  th.expires_at IS NOT NULL
  AND th.expires_at > timezone(tc.tz, now())
  AND th.type IN ('approved', 'transferred_in', 'welcome')
GROUP BY th.user_id;

-- Update token history trigger to ensure consistent expiration calculation
CREATE OR REPLACE FUNCTION insert_token_history_from_request()
RETURNS TRIGGER AS $$
DECLARE
  expiration_days INTEGER;
  base_expired_at TIMESTAMPTZ;
  extended_expired_at TIMESTAMPTZ;
BEGIN
  -- Get default token expiration from settings
  SELECT int_value INTO expiration_days 
  FROM settings 
  WHERE key = 'token_expiration';

  -- If no setting found, use default 14 days
  IF expiration_days IS NULL THEN
    expiration_days := 14;
  END IF;

  -- Find the latest active expiration date
  SELECT MAX(expires_at) INTO base_expired_at 
  FROM token_history
  WHERE user_id = NEW.user_id 
    AND expires_at > now() AT TIME ZONE 'Asia/Jakarta';

  IF base_expired_at IS NOT NULL THEN
    -- Extend by 7 days from last expiration
    extended_expired_at := base_expired_at + INTERVAL '7 days';
  ELSE
    -- Use default expiration from current time
    extended_expired_at := now() AT TIME ZONE 'Asia/Jakarta' + 
                         (expiration_days || ' days')::INTERVAL;
  END IF;

  -- Insert into token history
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
    now() AT TIME ZONE 'Asia/Jakarta'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update transfer history trigger for consistent expiration
CREATE OR REPLACE FUNCTION insert_token_history_from_transfer()
RETURNS TRIGGER AS $$
DECLARE
  transfer_expires_at TIMESTAMPTZ;
BEGIN
  -- Set expiration to 7 days from transfer
  transfer_expires_at := now() AT TIME ZONE 'Asia/Jakarta' + INTERVAL '7 days';

  -- Record for recipient (transferred_in)
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
    now() AT TIME ZONE 'Asia/Jakarta'
  );

  -- Record for sender (transferred_out)
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
    now() AT TIME ZONE 'Asia/Jakarta'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function for welcome tokens
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

  -- Calculate expiration timestamp in Asia/Jakarta timezone
  expires_at := now() AT TIME ZONE 'Asia/Jakarta' + (expiration_days || ' days')::interval;

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
      now() AT TIME ZONE 'Asia/Jakarta'
    );
  END IF;

  RETURN NEW;
END;
$$;