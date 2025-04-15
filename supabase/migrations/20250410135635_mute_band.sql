/*
  # Token History Table

  1. New Tables
    - `token_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, enum: 'approved', 'transferred_in', 'transferred_out', 'expired')
      - `amount` (integer)
      - `related_user_id` (uuid, references profiles, nullable)
      - `expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on user_id for faster lookups
    - Index on created_at for chronological queries

  3. Security
    - Enable RLS
    - Add policies for users to read their own history
    - Add policies for admins to read all histories
*/

-- Create token_history table
CREATE TABLE IF NOT EXISTS token_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('approved', 'transferred_in', 'transferred_out', 'expired')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  related_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token_history_user_id ON token_history(user_id);
CREATE INDEX IF NOT EXISTS idx_token_history_created_at ON token_history(created_at);

-- Enable RLS
ALTER TABLE token_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own history"
  ON token_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    related_user_id = auth.uid()
  );

CREATE POLICY "Admins can read all histories"
  ON token_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE token_history IS 'Records all token-related activities including approvals, transfers, and expirations';