-- Lock privileged admin SECURITY DEFINER RPCs to the server-side service role.
-- Admin API routes already use a server-only Supabase credential and validate
-- the hashed admin session before invoking these functions.

revoke all on function public.kingshot_admin_add_gift_code(text,text,date) from public, anon, authenticated;
revoke all on function public.kingshot_admin_audit(text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.kingshot_admin_delete_announcement(text,uuid) from public, anon, authenticated;
revoke all on function public.kingshot_admin_delete_banner_ad(text,uuid) from public, anon, authenticated;
revoke all on function public.kingshot_admin_get_maintenance(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_announcements(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_audit(text,integer) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_banner_ads(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_gift_codes(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_players(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_list_tickets(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_logout(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_scraper_comparison(text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_set_maintenance(text,boolean,text,timestamptz) from public, anon, authenticated;
revoke all on function public.kingshot_admin_set_player_enabled(text,text,boolean) from public, anon, authenticated;
revoke all on function public.kingshot_admin_update_ticket(text,uuid,text) from public, anon, authenticated;
revoke all on function public.kingshot_admin_upsert_announcement(text,uuid,text,text,text,text,text,timestamptz,timestamptz,boolean) from public, anon, authenticated;
revoke all on function public.kingshot_admin_upsert_banner_ad(text,uuid,text,text,text,text,text,text,text,text,text,text,boolean,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.kingshot_admin_validate_session(text) from public, anon, authenticated;

grant execute on function public.kingshot_admin_add_gift_code(text,text,date) to service_role;
grant execute on function public.kingshot_admin_audit(text,text,text,text,jsonb) to service_role;
grant execute on function public.kingshot_admin_delete_announcement(text,uuid) to service_role;
grant execute on function public.kingshot_admin_delete_banner_ad(text,uuid) to service_role;
grant execute on function public.kingshot_admin_get_maintenance(text) to service_role;
grant execute on function public.kingshot_admin_list_announcements(text) to service_role;
grant execute on function public.kingshot_admin_list_audit(text,integer) to service_role;
grant execute on function public.kingshot_admin_list_banner_ads(text) to service_role;
grant execute on function public.kingshot_admin_list_gift_codes(text) to service_role;
grant execute on function public.kingshot_admin_list_players(text) to service_role;
grant execute on function public.kingshot_admin_list_tickets(text) to service_role;
grant execute on function public.kingshot_admin_logout(text) to service_role;
grant execute on function public.kingshot_admin_scraper_comparison(text) to service_role;
grant execute on function public.kingshot_admin_set_maintenance(text,boolean,text,timestamptz) to service_role;
grant execute on function public.kingshot_admin_set_player_enabled(text,text,boolean) to service_role;
grant execute on function public.kingshot_admin_update_ticket(text,uuid,text) to service_role;
grant execute on function public.kingshot_admin_upsert_announcement(text,uuid,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;
grant execute on function public.kingshot_admin_upsert_banner_ad(text,uuid,text,text,text,text,text,text,text,text,text,text,boolean,timestamptz,timestamptz) to service_role;
grant execute on function public.kingshot_admin_validate_session(text) to service_role;
