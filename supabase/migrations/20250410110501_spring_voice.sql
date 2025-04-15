/*
  # Add Token Transfer System

  1. New Tables
    - `token_transfers`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `sender_email` (text)
      - `recipient_id` (uuid, references profiles)
      - `recipient_email` (text)
      - `amount` (integer)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on token_transfers table
    - Add policies for token transfers
    - Create function to handle token transfers safely

  3. Changes
    - Add function to transfer tokens between users
    - Ensure atomic transactions
    - Maintain minimum token balance
*/

-- Create token_transfers table
CREATE TABLE public.token_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at
CREATE TRIGGER update_token_transfers_updated_at
  BEFORE UPDATE ON public.token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.token_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for token_transfers
CREATE POLICY "Users can view their sent or received transfers"
  ON public.token_transfers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can create transfers"
  ON public.token_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Create function to handle token transfers
CREATE OR REPLACE FUNCTION transfer_tokens(
  recipient_email TEXT,
  transfer_amount INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_profile profiles%ROWTYPE;
  recipient_profile profiles%ROWTYPE;
  transfer_id UUID;
  min_balance INTEGER := 20; -- Minimum balance requirement
BEGIN
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