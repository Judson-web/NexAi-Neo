alter table public.kingshot_api_keys
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

create index if not exists kingshot_api_keys_owner_user_id_idx
  on public.kingshot_api_keys(owner_user_id, created_at desc);

create index if not exists kingshot_api_keys_owner_active_idx
  on public.kingshot_api_keys(owner_user_id, active);

revoke all on public.kingshot_api_keys from anon, authenticated;
revoke all on public.kingshot_api_usage from anon, authenticated;
grant all on public.kingshot_api_keys to service_role;
grant all on public.kingshot_api_usage to service_role;
