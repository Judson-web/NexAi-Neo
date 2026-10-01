-- Treat confirmed invalid Kingshot gift codes as expired for future worker cycles.
create or replace function public.list_kingshot_expired_gift_codes()
returns table(gift_code text)
language sql
security definer
set search_path to public
as $function$
  select distinct code as gift_code
  from public.kingshot_gift_codes
  where expires_at is not null and expires_at <= now()
  union
  select distinct gift_code
  from public.kingshot_redemptions
  where upper(status) = 'TIME_ERROR'
     or err_code = 40007
     or upper(status) = 'CDK_NOT_FOUND'
     or err_code = 40014;
$function$;

revoke execute on function public.list_kingshot_expired_gift_codes() from public, anon, authenticated;
grant execute on function public.list_kingshot_expired_gift_codes() to service_role;
