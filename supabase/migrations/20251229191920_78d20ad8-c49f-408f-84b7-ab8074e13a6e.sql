-- Fix the set_transaction_account_id function to include search_path
CREATE OR REPLACE FUNCTION public.set_transaction_account_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.account_id is null then
    select p.account_id into new.account_id
    from public.profiles p
    where p.id = auth.uid();
  end if;

  return new;
end;
$function$;