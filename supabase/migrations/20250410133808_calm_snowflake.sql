/*
  # Check Expired Tokens Function

  1. Function Description
    - Creates a function that checks for expired tokens based on settings
    - Returns a table of user IDs and their expired token amounts
    - Uses Asia/Jakarta timezone for all timestamp comparisons

  2. Return Values
    - user_id: UUID of the user
    - expired_amount: Integer amount of expired tokens
    - expiry_date: Timestamp when the tokens expired
*/

CREATE OR REPLACE FUNCTION check_expired_tokens()
RETURNS TABLE (
  user_id UUID,
  expired_amount INTEGER,
  expiry_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET timezone TO 'Asia/Jakarta'
AS $$
DECLARE
  expiry_days INTEGER;
BEGIN
  -- Get the expiration days from settings
  SELECT int_value INTO expiry_days
  FROM settings
  WHERE key = 'token_expiration';

  -- If no expiration setting found, use default 14 days
  IF expiry_days IS NULL THEN
    expiry_days := 14;
  END IF;

  -- Return expired tokens
  RETURN QUERY
  SELECT 
    p.id,
    p.api_tokens AS expired_amount,
    (p.updated_at + (expiry_days * INTERVAL '1 day')) AT TIME ZONE 'Asia/Jakarta' AS expiry_date
  FROM profiles p
  WHERE 
    p.api_tokens > 0
    AND p.updated_at + (expiry_days * INTERVAL '1 day') < CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta';

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_expired_tokens() TO authenticated;

-- Example usage:
-- SELECT * FROM check_expired_tokens();