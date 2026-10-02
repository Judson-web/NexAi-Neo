
-- Harden the shard lease for bounded workers. The previous 2-minute lease could
-- expire while a six-lane shard was still processing slow upstream requests.
-- Keep the lease longer than the maximum shard runtime so an overlapping run
-- cannot reclaim an in-flight slot during normal worst-case latency.
create or replace function public.claim_kingshot_worker_slot(p_slot integer)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_token uuid;
  v_now timestamptz := now();
begin
  if p_slot is null or p_slot < 0 or p_slot >= 3 then
    return jsonb_build_object('claimed',false,'reason','INVALID_SLOT');
  end if;

  update public.kingshot_worker_slots
  set lock_token=gen_random_uuid(),
      lock_until=v_now+interval '6 minutes',
      last_started_at=v_now,
      last_status='RUNNING',
      last_error=null,
      updated_at=v_now
  where slot=p_slot
    and (lock_until is null or lock_until < v_now)
  returning lock_token into v_token;

  if v_token is null then
    return jsonb_build_object('claimed',false,'reason','SLOT_ALREADY_RUNNING');
  end if;

  return jsonb_build_object('claimed',true,'slot',p_slot,'token',v_token::text,'started_at',v_now);
end
$function$;

revoke all on function public.claim_kingshot_worker_slot(integer) from public, anon, authenticated;
grant execute on function public.claim_kingshot_worker_slot(integer) to service_role;
