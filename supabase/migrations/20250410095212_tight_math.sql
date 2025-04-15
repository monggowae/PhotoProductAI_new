/*
  # Add approve_token_request function

  This function handles the token request approval process:
  1. Updates the token request status to 'approved'
  2. Increases the user's API tokens
  3. Ensures atomicity through a transaction
*/

CREATE OR REPLACE FUNCTION approve_token_request(request_id UUID, token_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve token requests';
  END IF;

  -- Start transaction
  BEGIN
    -- Update the token request status
    UPDATE token_requests
    SET status = 'approved',
        amount = token_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id
    AND status = 'pending';

    -- Increase the user's API tokens
    UPDATE profiles
    SET api_tokens = api_tokens + token_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT user_id
      FROM token_requests
      WHERE id = request_id
    );
  END;
END;
$$;