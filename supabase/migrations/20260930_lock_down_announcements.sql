-- Lock down announcements table access.
-- Public reads are served through SECURITY DEFINER RPCs; admin writes are server-mediated.
alter table public.kingshot_announcements enable row level security;
revoke all on public.kingshot_announcements from anon, authenticated;
