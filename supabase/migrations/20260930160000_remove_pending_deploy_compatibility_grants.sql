-- Remove temporary compatibility grants now that the hardened Vercel deployment is live.
revoke all on function public.kingshot_admin_list_players() from public, anon, authenticated;
grant execute on function public.kingshot_admin_list_players() to service_role;

revoke all on function public.submit_kingshot_support_ticket(text,text) from public, anon, authenticated;
grant execute on function public.submit_kingshot_support_ticket(text,text) to service_role;
