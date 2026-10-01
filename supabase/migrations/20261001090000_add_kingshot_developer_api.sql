create table if not exists public.kingshot_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  key_prefix text not null,
  key_hash text not null unique,
  active boolean not null default true,
  requests_per_minute integer not null default 30 check (requests_per_minute between 1 and 600),
  daily_limit integer not null default 500 check (daily_limit between 1 and 100000),
  total_requests bigint not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kingshot_api_usage (
  api_key_id uuid not null references public.kingshot_api_keys(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (api_key_id, usage_date)
);

alter table public.kingshot_api_keys enable row level security;
alter table public.kingshot_api_usage enable row level security;
revoke all on public.kingshot_api_keys from anon, authenticated;
revoke all on public.kingshot_api_usage from anon, authenticated;
grant all on public.kingshot_api_keys to service_role;
grant all on public.kingshot_api_usage to service_role;

create index if not exists kingshot_api_keys_hash_idx on public.kingshot_api_keys(key_hash) where active = true;

create or replace function public.consume_kingshot_api_key(p_key_hash text)
returns table (
  id uuid, name text, requests_per_minute integer, daily_limit integer,
  total_requests bigint, daily_requests integer, last_used_at timestamptz, allowed boolean
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  k public.kingshot_api_keys%rowtype;
  used integer;
begin
  select * into k from public.kingshot_api_keys
   where key_hash = p_key_hash and active = true for update;
  if not found then return; end if;

  insert into public.kingshot_api_usage(api_key_id, usage_date, request_count)
  values (k.id, current_date, 1)
  on conflict (api_key_id, usage_date)
  do update set request_count = public.kingshot_api_usage.request_count + 1, updated_at = now()
  returning request_count into used;

  if used > k.daily_limit then
    update public.kingshot_api_usage
       set request_count = request_count - 1, updated_at = now()
     where api_key_id = k.id and usage_date = current_date;
    return query select k.id,k.name,k.requests_per_minute,k.daily_limit,k.total_requests,
                         k.daily_limit,k.last_used_at,false;
    return;
  end if;

  update public.kingshot_api_keys
     set total_requests=total_requests+1,last_used_at=now(),updated_at=now()
   where id=k.id;

  return query select k.id,k.name,k.requests_per_minute,k.daily_limit,k.total_requests+1,
                       used,now(),true;
end;
$$;

revoke all on function public.consume_kingshot_api_key(text) from public, anon, authenticated;
grant execute on function public.consume_kingshot_api_key(text) to service_role;