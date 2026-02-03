-- Definitive Fix for Banks Table Permissions
-- This script will:
-- 1. Dynamically remove ALL existing policies on the 'banks' table (fixing any name conflicts)
-- 2. Re-enable security
-- 3. Create a single, simple rule allowing full access to your own data

DO $$
DECLARE
  pol record;
BEGIN
  -- Loop through all policies for the 'banks' table and drop them one by one
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'banks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "public"."banks";', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is on
ALTER TABLE "public"."banks" ENABLE ROW LEVEL SECURITY;

-- Create one unified policy for ALL operations (Select, Insert, Update, Delete)
CREATE POLICY "owner_access_policy" ON "public"."banks"
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
