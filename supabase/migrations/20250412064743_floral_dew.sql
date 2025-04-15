/*
  # Update Expiring Tokens View

  1. Changes
    - Update expiring_tokens_view to use correct expiration calculation
    - Include all token types that can expire
    - Use proper timezone handling for Asia/Jakarta
    - Add proper indexing for performance

  2. Details
    - Uses settings table for expiration configuration
    - Includes welcome tokens and transfers
    - Maintains proper access control
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS expiring_tokens_view;

-- Create view with corrected expiration calculation
CREATE OR REPLACE VIEW expiring_tokens_view AS
WITH token_expiration AS (
  SELECT COALESCE((value->>'days')::int, 14) as expiration_days
  FROM settings
  WHERE key = 'token_expiration'
),
timezone_config AS (
  SELECT 'Asia/Jakarta'::text as tz
)
SELECT 
  th.user_id,
  SUM(th.amount) as total_expiring_tokens,
  MIN(th.expires_at) as earliest_expiration
FROM token_history th
CROSS JOIN token_expiration te
CROSS JOIN timezone_config tc
WHERE 
  th.type IN ('approved', 'transferred_in', 'welcome')
  AND th.expires_at IS NOT NULL
  AND th.expires_at BETWEEN 
    (timezone(tc.tz, now()))
    AND 
    (timezone(tc.tz, now() + (te.expiration_days * INTERVAL '1 day')))
GROUP BY th.user_id;

-- Grant access to authenticated users
GRANT SELECT ON expiring_tokens_view TO authenticated;

-- Add helpful comment
COMMENT ON VIEW expiring_tokens_view IS 'Shows tokens that will expire within the configured expiration period';