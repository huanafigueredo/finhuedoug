-- Add color and type columns to couple_members
ALTER TABLE couple_members
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS type text DEFAULT 'person';

-- Add check constraint for type to ensure data integrity
DO $$ BEGIN
    ALTER TABLE couple_members
    ADD CONSTRAINT couple_members_type_check CHECK (type IN ('person', 'business'));
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
