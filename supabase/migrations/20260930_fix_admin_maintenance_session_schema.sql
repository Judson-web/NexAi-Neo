-- Optional maintenance end time plus private admin-session validation.
drop function if exists public.kingshot_public_maintenance();
drop function if exists public.kingshot_admin_get_maintenance(text);
drop function if exists public.kingshot_admin_set_maintenance(text,boolean,text);

alter table public.kingshot_site_settings add column if not exists ends_at timestamptz;

-- Keep maintenance administration on the private admin-session schema.
-- The maintenance admin RPCs must not look for the session table in public.
create or replace function public.kingshot_public_maintenance()
returns table(maintenance_enabled boolean, maintenance_message text, ends_at timestamptz, updated_at timestamptz)
language sql
security definer
set search_path to public
as $function$
  select s.maintenance_enabled and (s.ends_at is null or s.ends_at>now()),s.maintenance_message,s.ends_at,s.updated_at
  from public.kingshot_site_settings s where s.id=true limit 1
$function$;

create or replace function public.kingshot_admin_get_maintenance(p_token_hash text)
returns table(maintenance_enabled boolean, maintenance_message text, ends_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path to public, private
as $function$
begin
  if not exists(
    select 1 from private.kingshot_admin_sessions
    where token_hash=p_token_hash and expires_at>now()
  ) then
    raise exception 'Unauthorized';
  end if;
  return query
    select s.maintenance_enabled,s.maintenance_message,s.ends_at,s.updated_at
    from public.kingshot_site_settings s
    where s.id=true
    limit 1;
end
$function$;

create or replace function public.kingshot_admin_set_maintenance(
  p_token_hash text,
  p_enabled boolean,
  p_message text,
  p_ends_at timestamptz default null
)
returns table(maintenance_enabled boolean, maintenance_message text, ends_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path to public, private
as $function$
declare v_email text; v_message text;
begin
  select email into v_email
  from private.kingshot_admin_sessions
  where token_hash=p_token_hash and expires_at>now()
  limit 1;
  if v_email is null then raise exception 'Unauthorized'; end if;

  v_message=left(coalesce(nullif(trim(p_message),''),'We are performing maintenance right now. Please check back shortly.'),500);

  update public.kingshot_site_settings
    set maintenance_enabled=p_enabled,
        maintenance_message=v_message,
        ends_at=case when p_enabled then p_ends_at else null end,
        updated_at=now()
  where id=true;

  return query
    select s.maintenance_enabled,s.maintenance_message,s.ends_at,s.updated_at
    from public.kingshot_site_settings s
    where s.id=true
    limit 1;
end
$function$;