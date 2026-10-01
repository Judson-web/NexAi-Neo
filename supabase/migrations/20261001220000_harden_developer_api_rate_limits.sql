create table if not exists public.kingshot_api_rate_limits (
  api_key_id uuid primary key references public.kingshot_api_keys(id) on delete cascade,
  window_start timestamptz not null default date_trunc('minute', now()),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.kingshot_api_rate_limits enable row level security;
revoke all on public.kingshot_api_rate_limits from anon, authenticated;
grant all on public.kingshot_api_rate_limits to service_role;

create or replace function public.consume_kingshot_api_key(p_key_hash text)
returns table (
  id uuid,
  name text,
  requests_per_minute integer,
  daily_limit integer,
  total_requests bigint,
  daily_requests integer,
  minute_requests integer,
  last_used_at timestamptz,
  allowed boolean,
  rate_limited boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  k public.kingshot_api_keys%rowtype;
  used integer;
  minute_used integer;
  current_window timestamptz := date_trunc('minute', pg_catalog.now());
begin
  select k0.* into k
  from public.kingshot_api_keys k0
  where k0.key_hash = p_key_hash
    and k0.active = true
  for update;

  if not found then return; end if;

  insert into public.kingshot_api_rate_limits(api_key_id, window_start, request_count, updated_at)
  values (k.id, current_window, 1, pg_catalog.now())
  on conflict (api_key_id) do update
    set window_start = case when public.kingshot_api_rate_limits.window_start < current_window then current_window else public.kingshot_api_rate_limits.window_start end,
        request_count = case when public.kingshot_api_rate_limits.window_start < current_window then 1 else public.kingshot_api_rate_limits.request_count + 1 end,
        updated_at = pg_catalog.now()
  returning request_count into minute_used;

  if minute_used > k.requests_per_minute then
    update public.kingshot_api_rate_limits
      set request_count = request_count - 1, updated_at = pg_catalog.now()
      where api_key_id = k.id;
    return query select k.id,k.name,k.requests_per_minute,k.daily_limit,k.total_requests,
      coalesce((select u.request_count from public.kingshot_api_usage u where u.api_key_id=k.id and u.usage_date=pg_catalog.current_date),0),
      minute_used - 1,k.last_used_at,false,true;
    return;
  end if;

  insert into public.kingshot_api_usage(api_key_id, usage_date, request_count)
  values (k.id, pg_catalog.current_date, 1)
  on conflict (api_key_id, usage_date)
  do update set request_count = public.kingshot_api_usage.request_count + 1, updated_at = pg_catalog.now()
  returning request_count into used;

  if used > k.daily_limit then
    update public.kingshot_api_usage u
      set request_count = u.request_count - 1, updated_at = pg_catalog.now()
      where u.api_key_id=k.id and u.usage_date=pg_catalog.current_date;
    update public.kingshot_api_rate_limits
      set request_count = request_count - 1, updated_at = pg_catalog.now()
      where api_key_id=k.id;
    return query select k.id,k.name,k.requests_per_minute,k.daily_limit,k.total_requests,
      k.daily_limit,minute_used,k.last_used_at,false,false;
    return;
  end if;

  update public.kingshot_api_keys t
    set total_requests=t.total_requests+1,last_used_at=pg_catalog.now(),updated_at=pg_catalog.now()
    where t.id=k.id;

  return query select k.id,k.name,k.requests_per_minute,k.daily_limit,k.total_requests+1,
    used,minute_used,pg_catalog.now(),true,false;
end;
$$;

revoke all on function public.consume_kingshot_api_key(text) from public, anon, authenticated;
grant execute on function public.consume_kingshot_api_key(text) to service_role;