/*
  # Add Read Access Policy for Settings

  1. Changes
    - Add policy to allow all authenticated users to read settings
    - Maintain existing admin-only write access
    - Ensure proper access control

  2. Security
    - Read-only access for all authenticated users
    - Write access remains restricted to admins only
    - Maintains data security while allowing necessary access
*/

-- Create policy for read access
CREATE POLICY "Allow read access to all authenticated users"
ON settings
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Verify existing admin policy exists, create if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'settings' 
    AND policyname = 'Allow admin full access'
  ) THEN
    CREATE POLICY "Allow admin full access"
    ON settings
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;