-- Add type, closing_day, and due_day to banks table
ALTER TABLE "public"."banks" 
ADD COLUMN "type" text NOT NULL DEFAULT 'account' CHECK (type IN ('account', 'credit_card')),
ADD COLUMN "closing_day" integer CHECK (closing_day BETWEEN 1 AND 31),
ADD COLUMN "due_day" integer CHECK (due_day BETWEEN 1 AND 31);

COMMENT ON COLUMN "public"."banks"."type" IS 'Type of the institution: account (checking/savings) or credit_card';
COMMENT ON COLUMN "public"."banks"."closing_day" IS 'Closing day for credit cards (1-31)';
COMMENT ON COLUMN "public"."banks"."due_day" IS 'Due day for credit cards (1-31)';
