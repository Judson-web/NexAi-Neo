-- Remove the retired banner advertisement system.
-- Historical migrations are intentionally left unchanged.

drop function if exists public.kingshot_public_banner_ad(text,text,text);
drop function if exists public.kingshot_public_banner_ad(text,text);
drop function if exists public.kingshot_public_banner_click(uuid,text);
drop function if exists public.kingshot_admin_upsert_banner_ad(text,uuid,text,text,text,text,text,text,text,text,text,text,boolean,timestamptz,timestamptz);
drop function if exists public.kingshot_admin_list_banner_ads(text);
drop function if exists public.kingshot_admin_delete_banner_ad(text,uuid);
drop table if exists public.kingshot_banner_impression_dedupe cascade;
drop table if exists public.kingshot_banner_click_dedupe cascade;
drop table if exists public.kingshot_banner_ads cascade;
