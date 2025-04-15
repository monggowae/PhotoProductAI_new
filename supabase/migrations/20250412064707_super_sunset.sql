/*
  # Fix Token Expiration Calculation in View

  1. Changes
    - Update user_token_expired_breakdown view to use end-of-day expiration
    - Ensure all timestamps use Asia/Jakarta timezone
    - Fix expiration calculation to be 23:59:59 on the expiry day
    - Maintain proper handling for different token types

  2. Details
    - Uses date_trunc to get start of day
    - Adds days based on token type
    - Subtracts 1 second to get end of day (23:59:59)
*/

-- Drop existing view
DROP VIEW IF EXISTS user_token_expired_breakdown;

-- Recreate view with corrected expiration calculation
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
          -- Additional approval while having active tokens:
          -- End of day 7 days after the latest expiration
          (
            SELECT (date_trunc('day', MAX(expires_at) AT TIME ZONE 'Asia/Jakarta') + interval '8 days' - interval '1 second')
            FROM token_history prev
            WHERE prev.user_id = th.user_id
              AND prev.type = 'approved'
              AND prev.created_at < th.created_at
          ) AT TIME ZONE 'Asia/Jakarta'
        ELSE
          -- Initial approval:
          -- End of day N days after creation (where N is from settings)
          (
            date_trunc('day', th.created_at AT TIME ZONE 'Asia/Jakarta') + 
            ((SELECT expiration_days + 1 FROM token_config) * interval '1 day') - 
            interval '1 second'
          ) AT TIME ZONE 'Asia/Jakarta'
      END
    WHEN th.type IN ('transferred_in', 'welcome') THEN
      -- Transfers and welcome tokens:
      -- End of day 7 days after creation
      (
        date_trunc('day', th.created_at AT TIME ZONE 'Asia/Jakarta') + 
        interval '8 days' - 
        interval '1 second'
      ) AT TIME ZONE 'Asia/Jakarta'
    ELSE NULL
  END as expires_at
FROM token_history th
WHERE th.type IN ('approved', 'transferred_in', 'transferred_out', 'welcome')
ORDER BY th.user_id, expires_at;

-- Grant access to authenticated users
GRANT SELECT ON user_token_expired_breakdown TO authenticated;

-- Add helpful comment
COMMENT ON VIEW user_token_expired_breakdown IS 'Shows breakdown of user token balance with expiration dates. Tokens expire at 23:59:59 Jakarta time on their expiry day.';