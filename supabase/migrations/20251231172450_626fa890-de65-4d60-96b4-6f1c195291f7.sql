-- Add show_on_dashboard column to couple_members
ALTER TABLE couple_members 
ADD COLUMN show_on_dashboard BOOLEAN NOT NULL DEFAULT false;