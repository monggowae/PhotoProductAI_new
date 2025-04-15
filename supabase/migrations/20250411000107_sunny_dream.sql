/*
  # Token History Triggers for Approvals and Transfers

  1. Changes
    - Add function to record token history on approval
    - Add function to record token history on transfer
    - Add triggers to automatically record history

  2. Features
    - Handles token expiration calculation:
      * For approvals: Extends expiration by 7 days if active tokens exist
      * For transfers: Sets 7-day expiration from transfer date
    - Uses settings table for default expiration period
    - Maintains proper timezone handling
*/

-- Function to record token history when request is approved
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
    AND expires_at > timezone('Asia/Jakarta', now());

  IF base_expired_at IS NOT NULL THEN
    -- Extend by 7 days from last expiration
    extended_expired_at := base_expired_at + INTERVAL '7 days';
  ELSE
    -- Use default expiration from current time
    extended_expired_at := timezone('Asia/Jakarta', now()) + 
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
    timezone('Asia/Jakarta', now())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for token request approval
DROP TRIGGER IF EXISTS trg_insert_token_history_from_request ON token_requests;
CREATE TRIGGER trg_insert_token_history_from_request
  AFTER UPDATE ON token_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION insert_token_history_from_request();

-- Function to record token history for transfers
CREATE OR REPLACE FUNCTION insert_token_history_from_transfer()
RETURNS TRIGGER AS $$
DECLARE
  transfer_expires_at TIMESTAMPTZ;
BEGIN
  -- Set expiration to 7 days from transfer
  transfer_expires_at := timezone('Asia/Jakarta', NEW.created_at) + INTERVAL '7 days';

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
    timezone('Asia/Jakarta', NEW.created_at)
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
    timezone('Asia/Jakarta', NEW.created_at)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for token transfers
DROP TRIGGER IF EXISTS trg_insert_token_history_from_transfer ON token_transfers;
CREATE TRIGGER trg_insert_token_history_from_transfer
  AFTER INSERT ON token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION insert_token_history_from_transfer();