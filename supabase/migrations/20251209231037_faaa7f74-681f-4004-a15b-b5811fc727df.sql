-- Create security definer function to check whitelist membership
-- This prevents infinite recursion in RLS policies
create or replace function public.is_allowed_user(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_users
    where user_id = _user_id
  )
$$;

-- Enable RLS on allowed_users (no policies = only service role can manage)
alter table public.allowed_users enable row level security;

-- Drop existing policies on sensitive tables
drop policy if exists "Users can manage own banks" on public.banks;
drop policy if exists "Users can manage own payment_methods" on public.payment_methods;
drop policy if exists "Users can manage own recipients" on public.recipients;
drop policy if exists "Users can manage own transactions" on public.transactions;

-- Create new policies with whitelist check for banks
create policy "Allowed users can manage own banks"
on public.banks
for all
to authenticated
using (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
)
with check (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
);

-- Create new policies with whitelist check for payment_methods
create policy "Allowed users can manage own payment_methods"
on public.payment_methods
for all
to authenticated
using (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
)
with check (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
);

-- Create new policies with whitelist check for recipients
create policy "Allowed users can manage own recipients"
on public.recipients
for all
to authenticated
using (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
)
with check (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
);

-- Create new policies with whitelist check for transactions
create policy "Allowed users can manage own transactions"
on public.transactions
for all
to authenticated
using (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
)
with check (
  user_id = auth.uid()
  and public.is_allowed_user(auth.uid())
);