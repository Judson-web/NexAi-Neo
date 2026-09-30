create or replace function public.kingshot_admin_list_players(p_token_hash text)
returns setof public.kingshot_autoredeem
language plpgsql
security definer
set search_path=public,private
as $function$
begin
  if not exists (
    select 1
    from private.kingshot_admin_sessions
    where token_hash=p_token_hash
      and expires_at>now()
  ) then
    raise exception 'Unauthorized';
  end if;

  return query
    select *
    from public.kingshot_autoredeem
    order by created_at asc;
end
$function$;

revoke all on function public.kingshot_admin_list_players() from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_players(text) from public, anon, authenticated;
grant execute on function public.kingshot_admin_list_players(text) to anon, authenticated, service_role;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.lookup_history from anon, authenticated;
