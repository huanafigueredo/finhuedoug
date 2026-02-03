-- EMERGENCY RESTORE: Make all banks visible again
-- This command turns off the security checks, so all data reappears.
ALTER TABLE "public"."banks" DISABLE ROW LEVEL SECURITY;

-- Optional: Verify data is still there
SELECT count(*) as total_banks FROM "public"."banks";
