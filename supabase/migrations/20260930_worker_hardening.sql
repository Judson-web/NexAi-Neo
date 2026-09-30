-- Harden the auto-redeem worker lease and kingdom revalidation retry path.

create or replace function public.heartbeat_kingshot_worker_run(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.kingshot_worker_state
  set lock_until=greatest(coalesce(lock_until,now()),now()+interval '30 minutes'),
      updated_at=now()
  where id=true and lock_token=p_token;
  return found;
end
$function$;

create or replace function public.release_kingshot_kingdom_reset_check(p_player_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.kingshot_autoredeem
  set kingdom_check_claimed_at=null,
      updated_at=now()
  where player_id=p_player_id and enabled=true and stale=false;
  return found;
end
$function$;

revoke all on function public.heartbeat_kingshot_worker_run(uuid) from public;
revoke all on function public.release_kingshot_kingdom_reset_check(text) from public;
grant execute on function public.heartbeat_kingshot_worker_run(uuid) to anon,authenticated;
grant execute on function public.release_kingshot_kingdom_reset_check(text) to anon,authenticated;
