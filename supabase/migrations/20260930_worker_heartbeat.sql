create or replace function public.heartbeat_kingshot_worker_run(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.kingshot_worker_state
  set lock_until=now()+interval '30 minutes',
      updated_at=now()
  where id=true
    and lock_token=p_token;
  return found;
end
$function$;

revoke all on function public.heartbeat_kingshot_worker_run(uuid) from public;
grant execute on function public.heartbeat_kingshot_worker_run(uuid) to anon, authenticated;
