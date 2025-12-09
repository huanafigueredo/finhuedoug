-- Delete any orphaned records with NULL user_id (if any exist)
DELETE FROM banks WHERE user_id IS NULL;
DELETE FROM payment_methods WHERE user_id IS NULL;
DELETE FROM recipients WHERE user_id IS NULL;
DELETE FROM transactions WHERE user_id IS NULL;

-- Make user_id columns NOT NULL to prevent orphaned data
ALTER TABLE banks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_methods ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE recipients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;