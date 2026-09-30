create extension if not exists pgcrypto;

revoke all on function public.claim_kingshot_kingdom_reset_check(text) from public, anon, authenticated;
grant execute on function public.claim_kingshot_kingdom_reset_check(text) to service_role;
revoke all on function public.claim_kingshot_redemption(text,text) from public, anon, authenticated;
grant execute on function public.claim_kingshot_redemption(text,text) to service_role;
revoke all on function public.claim_kingshot_worker_run() from public, anon, authenticated;
grant execute on function public.claim_kingshot_worker_run() to service_role;
revoke all on function public.finish_kingshot_worker_run(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.finish_kingshot_worker_run(uuid,text,text,jsonb) to service_role;
revoke all on function public.kingshot_record_scraper_run(text,integer,integer,jsonb,boolean,text,text) from public, anon, authenticated;
grant execute on function public.kingshot_record_scraper_run(text,integer,integer,jsonb,boolean,text,text) to service_role;
revoke all on function public.list_kingshot_admin_gift_codes() from public, anon, authenticated;
grant execute on function public.list_kingshot_admin_gift_codes() to service_role;
revoke all on function public.list_kingshot_autoredeem_players() from public, anon, authenticated;
grant execute on function public.list_kingshot_autoredeem_players() to service_role;
revoke all on function public.list_kingshot_expired_gift_codes() from public, anon, authenticated;
grant execute on function public.list_kingshot_expired_gift_codes() to service_role;
revoke all on function public.list_kingshot_player_redemptions(text) from public, anon, authenticated;
grant execute on function public.list_kingshot_player_redemptions(text) to service_role;
revoke all on function public.mark_kingshot_player_stale(text,text) from public, anon, authenticated;
grant execute on function public.mark_kingshot_player_stale(text,text) to service_role;
revoke all on function public.record_kingshot_kingdom_revalidation(text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_kingshot_kingdom_revalidation(text,text,text,text) to service_role;
revoke all on function public.record_kingshot_redemption(text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.record_kingshot_redemption(text,text,text,integer,text) to service_role;
revoke all on function public.record_kingshot_scraper_health(text,integer,text) from public, anon, authenticated;
grant execute on function public.record_kingshot_scraper_health(text,integer,text) to service_role;
revoke all on function public.release_kingshot_kingdom_reset_check(text) from public, anon, authenticated;
grant execute on function public.release_kingshot_kingdom_reset_check(text) to service_role;
revoke all on function public.upsert_kingshot_gift_code(text,date) from public, anon, authenticated;
grant execute on function public.upsert_kingshot_gift_code(text,date) to service_role;
revoke all on function public.verify_kingshot_scheduler_token(text) from public, anon, authenticated;
grant execute on function public.verify_kingshot_scheduler_token(text) to service_role;

drop function public.kingshot_admin_create_session(text,text,text);
create function public.kingshot_admin_create_session(
  p_email text,
  p_password_hash text,
  p_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path=public,private,extensions
as $function$
declare
  v_email text:=lower(trim(p_email));
  v_hash text;
begin
  select password_hash into v_hash
  from private.kingshot_admin_credentials
  where lower(email)=v_email
  limit 1;

  if v_hash is null then return false; end if;

  if v_hash like '$2a$%' or v_hash like '$2b$%' or v_hash like '$2y$%' then
    if crypt(p_password_hash,v_hash)<>v_hash then return false; end if;
  elsif length(p_password_hash)=64 and p_password_hash ~ '^[0-9a-fA-F]{64}    where lower(email)=v_email;
  else
    return false;
  end if;

  delete from private.kingshot_admin_sessions where expires_at<now();
  insert into private.kingshot_admin_sessions(token_hash,email,expires_at)
  values(p_token_hash,v_email,now()+interval '12 hours')
  on conflict(token_hash) do update set expires_at=excluded.expires_at,email=excluded.email;
  return true;
end
$function$;

revoke all on function public.kingshot_admin_create_session(text,text,text) from public, anon, authenticated;
grant execute on function public.kingshot_admin_create_session(text,text,text) to service_role;

        and lower(p_password_hash)=lower(v_hash) then
    null;
  elsif encode(digest(p_password_hash,'sha256'),'hex')=v_hash then
    update private.kingshot_admin_credentials
    set password_hash=crypt(p_password_hash,gen_salt('bf',12))
    where lower(email)=v_email;
  else
    return false;
  end if;

  delete from private.kingshot_admin_sessions where expires_at<now();
  insert into private.kingshot_admin_sessions(token_hash,email,expires_at)
  values(p_token_hash,v_email,now()+interval '12 hours')
  on conflict(token_hash) do update set expires_at=excluded.expires_at,email=excluded.email;
  return true;
end
$function$;

revoke all on function public.kingshot_admin_create_session(text,text,text) from public, anon, authenticated;
grant execute on function public.kingshot_admin_create_session(text,text,text) to service_role;
