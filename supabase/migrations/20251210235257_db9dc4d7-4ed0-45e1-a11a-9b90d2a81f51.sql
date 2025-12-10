-- Add recurring income fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN recurring_day integer,
ADD COLUMN recurring_duration text,
ADD COLUMN recurring_end_date date;