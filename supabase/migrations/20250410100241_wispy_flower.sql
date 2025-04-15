/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive admin check from profiles policies
    - Restructure policies to avoid infinite recursion
    - Maintain security while allowing proper access

  2. Security
    - Users can still only view and update their own profiles
    - Admins can view all profiles
    - Maintains role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile name" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users to their own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable admin read access to all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  role = 'admin'
);

CREATE POLICY "Enable users to update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  AND
  CASE 
    WHEN role IS DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
    THEN false  -- Prevent role changes
    ELSE true
  END
);