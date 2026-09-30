revoke all on function public.heartbeat_kingshot_worker_run(uuid) from public, anon, authenticated;
grant execute on function public.heartbeat_kingshot_worker_run(uuid) to service_role;

revoke all on function public.get_kingshot_registration(text) from public, anon, authenticated;
grant execute on function public.get_kingshot_registration(text) to service_role;

revoke all on function public.register_kingshot_player(text,text,text,text) from public, anon, authenticated;
grant execute on function public.register_kingshot_player(text,text,text,text) to service_role;

revoke all on function public.register_kingshot_player_v2(text,text,text,text) from public, anon, authenticated;
grant execute on function public.register_kingshot_player_v2(text,text,text,text) to service_role;

revoke all on function public.submit_kingshot_support_ticket(text,text) from public, anon, authenticated;
grant execute on function public.submit_kingshot_support_ticket(text,text) to service_role;
