-- Worker run lock and durable cycle state
create table if not exists public.kingshot_worker_state(
 id boolean primary key default true,
 lock_token uuid,
 lock_until timestamptz,
 last_started_at timestamptz,
 last_finished_at timestamptz,
 last_status text not null default 'IDLE',
 last_error text,
 last_summary jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
insert into public.kingshot_worker_state(id) values(true) on conflict(id) do nothing;
alter table public.kingshot_worker_state enable row level security;
revoke all on public.kingshot_worker_state from anon,authenticated;

create or replace function public.claim_kingshot_worker_run()
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare v_token uuid; v_now timestamptz:=now();
begin
 insert into public.kingshot_worker_state(id) values(true) on conflict(id) do nothing;
 update public.kingshot_worker_state
 set lock_token=gen_random_uuid(),lock_until=v_now+interval '30 minutes',
     last_started_at=v_now,last_status='RUNNING',last_error=null,updated_at=v_now
 where id=true and (lock_until is null or lock_until<v_now)
 returning lock_token into v_token;
 if v_token is null then return jsonb_build_object('claimed',false); end if;
 return jsonb_build_object('claimed',true,'token',v_token::text,'started_at',v_now);
end
$function$;

create or replace function public.finish_kingshot_worker_run(
 p_token uuid,p_status text,p_error text default null,p_summary jsonb default '{}'::jsonb
)
returns boolean language plpgsql security definer set search_path=public
as $function$
begin
 update public.kingshot_worker_state
 set lock_token=null,lock_until=null,last_finished_at=now(),
     last_status=left(coalesce(p_status,'COMPLETED'),32),
     last_error=left(p_error,1000),last_summary=coalesce(p_summary,'{}'::jsonb),updated_at=now()
 where id=true and lock_token=p_token;
 return found;
end
$function$;

revoke all on function public.claim_kingshot_worker_run() from public;
revoke all on function public.finish_kingshot_worker_run(uuid,text,text,jsonb) from public;
grant execute on function public.claim_kingshot_worker_run() to anon,authenticated;
grant execute on function public.finish_kingshot_worker_run(uuid,text,text,jsonb) to anon,authenticated;