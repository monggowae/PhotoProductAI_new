/*
  # Token Expiry Breakdown View

  1. New View
    - Creates user_token_expired_breakdown view to show token expiration details
    - Handles different expiration rules for approvals and transfers
    - Uses settings table for configuration
    - Includes proper timezone handling

  2. Features
    - Shows breakdown of token balance by expiration date
    - Handles different expiration rules:
      * Initial approval: Uses token_expiration from settings
      * Additional approval: Adds 7 days to last expiration
      * Transfers: 7 days from transfer date
    
  3. Security
    - Grants SELECT access to authenticated users
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_token_expired_breakdown;

-- Create the view
CREATE OR REPLACE VIEW user_token_expired_breakdown AS
WITH token_config AS (
  SELECT 
    COALESCE((value->>'days')::int, 14) as expiration_days
  FROM settings 
  WHERE key = 'token_expiration'
)
SELECT
  th.user_id,
  th.amount,
  th.type,
  th.created_at AT TIME ZONE 'Asia/Jakarta' as created_at,
  CASE
    WHEN th.type = 'approved' THEN
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM token_history prev
          WHERE prev.user_id = th.user_id
            AND prev.type = 'approved'
            AND prev.created_at < th.created_at
            AND prev.expires_at > th.created_at
        ) THEN
          -- Additional approval while having active tokens
          (
            SELECT MAX(expires_at) + interval '7 days'
            FROM token_history prev
            WHERE prev.user_id = th.user_id
              AND prev.type = 'approved'
              AND prev.created_at < th.created_at
          )
        ELSE
          -- Initial approval
          th.created_at + (SELECT expiration_days * interval '1 day' FROM token_config)
      END
    WHEN th.type IN ('transferred_in', 'transferred_out') THEN 
      th.created_at + interval '7 days'
    ELSE NULL
  END AT TIME ZONE 'Asia/Jakarta' as expires_at
FROM token_history th
ORDER BY th.user_id, expires_at;

-- Grant access to authenticated users
GRANT SELECT ON user_token_expired_breakdown TO authenticated;

-- Add helpful comment
COMMENT ON VIEW user_token_expired_breakdown IS 'Shows breakdown of user token balance with expiration dates. Handles different expiration rules for approvals and transfers.';