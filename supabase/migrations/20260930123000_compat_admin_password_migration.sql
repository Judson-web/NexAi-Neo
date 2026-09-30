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
  select password_hash into v_hash from private.kingshot_admin_credentials
  where lower(email)=v_email limit 1;
  if v_hash is null then return false; end if;

  if v_hash like '$2a$%' or v_hash like '$2b$%' or v_hash like '$2y$%' then
    if crypt(p_password_hash,v_hash)<>v_hash then return false; end if;
  elsif length(p_password_hash)=64 and p_password_hash ~ '^[0-9a-fA-F]{64}$'
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
