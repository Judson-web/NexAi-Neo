-- Fix schema-drifted maintenance RPC. Qualify table columns because the RETURNS TABLE names
-- are also PL/pgSQL output variables.
create or replace function public.kingshot_public_maintenance()
returns table(maintenance_enabled boolean, maintenance_message text, ends_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path=public
as $function$
begin
  if exists (
    select 1
    from public.kingshot_site_settings s
    where s.id=true
      and s.maintenance_enabled=true
      and s.ends_at is not null
      and s.ends_at <= now()
  ) then
    update public.kingshot_site_settings s
      set maintenance_enabled=false,
          ends_at=null,
          updated_at=now()
    where s.id=true
      and s.maintenance_enabled=true
      and s.ends_at is not null
      and s.ends_at <= now();
  end if;

  return query
    select s.maintenance_enabled,
           s.maintenance_message,
           s.ends_at,
           s.updated_at
    from public.kingshot_site_settings s
    where s.id=true
    limit 1;
end
$function$;
