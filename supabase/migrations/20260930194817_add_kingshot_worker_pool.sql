-- Add a small durable worker pool for Kingshot redemption fan-out.
create table if not exists public.kingshot_worker_slots(
  slot integer primary key check(slot >= 0 and slot < 3),
  lock_token uuid,
  lock_until timestamptz,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_status text not null default 'IDLE',
  last_error text,
  last_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.kingshot_worker_slots(slot)
values (0),(1),(2)
on conflict(slot) do nothing;

alter table public.kingshot_worker_slots enable row level security;
revoke all on public.kingshot_worker_slots from public, anon, authenticated;

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
      lock_until=v_now+interval '2 minutes',
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

  return jsonb_build_object(
    'claimed',true,
    'slot',p_slot,
    'token',v_token::text,
    'started_at',v_now
  );
end
$function$;

create or replace function public.finish_kingshot_worker_slot(
  p_slot integer,
  p_token uuid,
  p_status text,
  p_error text default null,
  p_summary jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path=public
as $function$
begin
  update public.kingshot_worker_slots
  set lock_token=null,
      lock_until=null,
      last_finished_at=now(),
      last_status=left(coalesce(p_status,'COMPLETED'),32),
      last_error=left(p_error,1000),
      last_summary=coalesce(p_summary,'{}'::jsonb),
      updated_at=now()
  where slot=p_slot
    and lock_token=p_token;

  return found;
end
$function$;

revoke all on function public.claim_kingshot_worker_slot(integer) from public, anon, authenticated;
revoke all on function public.finish_kingshot_worker_slot(integer,uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.claim_kingshot_worker_slot(integer) to service_role;
grant execute on function public.finish_kingshot_worker_slot(integer,uuid,text,text,jsonb) to service_role;
