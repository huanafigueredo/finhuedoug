-- Enable RLS on banks table (ensure it is on)
ALTER TABLE "public"."banks" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own banks" ON "public"."banks";
DROP POLICY IF EXISTS "Users can insert their own banks" ON "public"."banks";
DROP POLICY IF EXISTS "Users can update their own banks" ON "public"."banks";
DROP POLICY IF EXISTS "Users can delete their own banks" ON "public"."banks";

DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "public"."banks";
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "public"."banks";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."banks";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."banks";

-- Re-create comprehensive policies
CREATE POLICY "Users can view their own banks" ON "public"."banks"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banks" ON "public"."banks"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks" ON "public"."banks"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks" ON "public"."banks"
  FOR DELETE USING (auth.uid() = user_id);
