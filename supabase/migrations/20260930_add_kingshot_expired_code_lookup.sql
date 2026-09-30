create or replace function public.list_kingshot_expired_gift_codes()
returns table(gift_code text)
language sql
security definer
set search_path = public
as $$
  select distinct gift_code
  from public.kingshot_redemptions
  where upper(status) = 'TIME_ERROR'
     or err_code = 40007;
$$;

grant execute on function public.list_kingshot_expired_gift_codes() to anon, authenticated;
