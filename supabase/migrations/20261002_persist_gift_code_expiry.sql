-- Persist gift-code expiry dates and enforce them at ingestion time.
alter table public.kingshot_gift_codes
  add column if not exists expires_at timestamptz;

create or replace function public.upsert_kingshot_gift_code(
  p_code text,
  p_source_date date default null,
  p_expires_at timestamptz default null
)
returns public.kingshot_gift_codes
language plpgsql
security definer
set search_path to public
as $function$
declare
  v public.kingshot_gift_codes;
  v_code text := trim(p_code);
begin
  if v_code is null
     or length(v_code) < 6
     or length(v_code) > 32
     or v_code !~ '^[A-Za-z0-9_-]+$'
     or v_code ~* '^u00[0-9a-f]+'
     or upper(v_code) in ('ACTIVE','EXPIRED','CONTINUE','COPYCODE','SIGNINTOREDEEM','SHARELINK','GIFTCODES','REDEEMGIFTCODE','GIFTCODE','LOADING','COMMUNITY','FEATURES','LATEST','CURRENT','POPULAR','PROFILE','PLAYER','KINGDOM','SERVER','MESSAGE','SETTINGS') then
    raise exception 'Rejected invalid Kingshot gift code';
  end if;

  insert into public.kingshot_gift_codes(code, source_date, last_seen_at, active, expires_at)
  values(
    v_code,
    p_source_date,
    now(),
    coalesce(p_expires_at is null or p_expires_at > now(), true),
    p_expires_at
  )
  on conflict(code) do update set
    source_date = coalesce(excluded.source_date, kingshot_gift_codes.source_date),
    last_seen_at = now(),
    expires_at = coalesce(excluded.expires_at, kingshot_gift_codes.expires_at),
    active = case
      when coalesce(excluded.expires_at, kingshot_gift_codes.expires_at) is not null
        and coalesce(excluded.expires_at, kingshot_gift_codes.expires_at) <= now() then false
      else true
    end
  returning * into v;

  return v;
end
$function$;

create or replace function public.list_kingshot_expired_gift_codes()
returns table(gift_code text)
language sql
security definer
set search_path to public
as $function$
  select distinct code as gift_code
  from public.kingshot_gift_codes
  where expires_at is not null and expires_at <= now()
  union
  select distinct gift_code
  from public.kingshot_redemptions
  where upper(status) = 'TIME_ERROR'
     or err_code = 40007;
$function$;

revoke execute on function public.upsert_kingshot_gift_code(text,date,timestamptz) from public, anon, authenticated;
grant execute on function public.upsert_kingshot_gift_code(text,date,timestamptz) to service_role;
revoke execute on function public.list_kingshot_expired_gift_codes() from public, anon, authenticated;
grant execute on function public.list_kingshot_expired_gift_codes() to service_role;
