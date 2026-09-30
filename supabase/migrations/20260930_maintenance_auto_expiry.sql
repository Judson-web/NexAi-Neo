create or replace function public.kingshot_public_maintenance()
returns table(
  maintenance_enabled boolean,
  maintenance_message text,
  ends_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if exists (
    select 1 from public.kingshot_site_settings
    where id=true and maintenance_enabled=true and ends_at is not null and ends_at <= now()
  ) then
    update public.kingshot_site_settings
      set maintenance_enabled=false, ends_at=null, updated_at=now()
    where id=true and maintenance_enabled=true and ends_at is not null and ends_at <= now();
  end if;
  return query
    select s.maintenance_enabled,s.maintenance_message,s.ends_at,s.updated_at
    from public.kingshot_site_settings s where s.id=true limit 1;
end
$function$;

create or replace function public.kingshot_admin_get_maintenance(p_token_hash text)
returns table(
  maintenance_enabled boolean,
  maintenance_message text,
  ends_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  if not exists(
    select 1 from private.kingshot_admin_sessions
    where token_hash=p_token_hash and expires_at>now()
  ) then
    raise exception 'Unauthorized';
  end if;
  if exists (
    select 1 from public.kingshot_site_settings
    where id=true and maintenance_enabled=true and ends_at is not null and ends_at <= now()
  ) then
    update public.kingshot_site_settings
      set maintenance_enabled=false, ends_at=null, updated_at=now()
    where id=true and maintenance_enabled=true and ends_at is not null and ends_at <= now();
  end if;
  return query
    select s.maintenance_enabled,s.maintenance_message,s.ends_at,s.updated_at
    from public.kingshot_site_settings s where s.id=true limit 1;
end
$function$;