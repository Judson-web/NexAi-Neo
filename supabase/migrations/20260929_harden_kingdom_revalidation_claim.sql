alter table public.kingshot_autoredeem
  add column if not exists kingdom_check_claimed_at timestamptz;

create or replace function public.claim_kingshot_kingdom_reset_check(p_player_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  r public.kingshot_autoredeem%rowtype;
  v_now timestamptz := now();
  v_local timestamp;
  v_reset_boundary timestamp;
  v_last_local timestamp;
  v_last_reset timestamp;
  v_claim_expired boolean := false;
begin
  select * into r from public.kingshot_autoredeem
  where player_id=p_player_id and enabled=true and stale=false for update;
  if not found then return jsonb_build_object('claimed',false); end if;

  v_local := v_now at time zone 'Asia/Kolkata';
  v_reset_boundary := date_trunc('day',v_local) + interval '5 hours 30 minutes';
  if v_local < v_reset_boundary then
    v_reset_boundary := v_reset_boundary - interval '1 day';
  end if;

  if r.last_kingdom_check_at is not null then
    v_last_local := r.last_kingdom_check_at at time zone 'Asia/Kolkata';
    v_last_reset := date_trunc('day',v_last_local) + interval '5 hours 30 minutes';
    if v_last_local < v_last_reset then
      v_last_reset := v_last_reset - interval '1 day';
    end if;
    if v_last_reset >= v_reset_boundary then
      return jsonb_build_object('claimed',false);
    end if;
  end if;

  v_claim_expired := r.kingdom_check_claimed_at is null
    or r.kingdom_check_claimed_at < v_now - interval '10 minutes';
  if not v_claim_expired then return jsonb_build_object('claimed',false); end if;

  update public.kingshot_autoredeem
  set kingdom_check_claimed_at=v_now, updated_at=v_now
  where player_id=p_player_id;

  return jsonb_build_object('claimed',true);
end;
$function$;

create or replace function public.record_kingshot_kingdom_revalidation(
  p_player_id text, p_kingdom_id text,
  p_player_name text default null, p_avatar_url text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $function$
declare
  v public.kingshot_autoredeem;
  v_old_kingdom text;
  v_changed boolean := false;
begin
  select kingdom_id into v_old_kingdom from public.kingshot_autoredeem
  where player_id=p_player_id for update;
  if not found then return jsonb_build_object('ok',false,'reason','PLAYER_NOT_REGISTERED'); end if;

  v_changed := v_old_kingdom is distinct from p_kingdom_id;

  update public.kingshot_autoredeem
  set kingdom_id=p_kingdom_id,
      player_name=coalesce(p_player_name,player_name),
      avatar_url=coalesce(p_avatar_url,avatar_url),
      last_kingdom_check_at=now(),
      kingdom_check_claimed_at=null,
      stale=false, stale_at=null, stale_reason=null, updated_at=now()
  where player_id=p_player_id
  returning * into v;

  insert into public.kingshot_player_events(player_id,event_type,old_kingdom_id,new_kingdom_id)
  values(p_player_id,case when v_changed then 'kingdom_changed' else 'revalidated' end,v_old_kingdom,p_kingdom_id);

  return jsonb_build_object('ok',true,'kingdom_changed',v_changed,
    'old_kingdom_id',v_old_kingdom_id,'new_kingdom_id',p_kingdom_id,'player',to_jsonb(v));
end
$function$;