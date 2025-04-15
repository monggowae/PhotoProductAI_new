/*
  # Add Token Usage Table and Functions

  1. New Tables
    - `token_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `service` (text) - Type of service used
      - `tokens_used` (integer)
      - `created_at` (timestamptz)
      - `status` (text) - success/failed

  2. Functions
    - Add function to handle token deduction
    - Record usage history
    - Update user's token balance
*/

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  service text NOT NULL,
  tokens_used integer NOT NULL CHECK (tokens_used > 0),
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
  ON token_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all usage"
  ON token_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to handle token usage
CREATE OR REPLACE FUNCTION record_token_usage(
  p_user_id uuid,
  p_service text,
  p_tokens_used integer,
  p_status text DEFAULT 'success'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_id uuid;
BEGIN
  -- Validate parameters
  IF p_tokens_used <= 0 THEN
    RAISE EXCEPTION 'Tokens used must be positive';
  END IF;

  IF p_status NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- If status is success, deduct tokens from user's balance
  IF p_status = 'success' THEN
    UPDATE profiles
    SET 
      api_tokens = api_tokens - p_tokens_used,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    AND api_tokens >= p_tokens_used;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient tokens';
    END IF;
  END IF;

  -- Record usage
  INSERT INTO token_usage (
    user_id,
    service,
    tokens_used,
    status
  )
  VALUES (
    p_user_id,
    p_service,
    p_tokens_used,
    p_status
  )
  RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);