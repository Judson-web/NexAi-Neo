-- Move pg_net out of the exposed public schema.
-- The request queue is empty before this migration; extension-owned response
-- history is ephemeral and can be recreated safely.
create schema if not exists extensions;
create schema if not exists net;

drop extension pg_net;
create extension pg_net with schema extensions;

do $$
declare
  v_command text := $cmd$
select extensions.http_post(
  url:='https://kingshot-autoredeemer.vercel.app/api/kingshot-auto',
  headers:=jsonb_build_object('Content-Type','application/json','X-Kingshot-Scheduler-Token',(select token_plain from private.kingshot_scheduler_config where id=true)),
  body:='{}'::jsonb,
  timeout_milliseconds:=5000
)
$cmd$;
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname='kingshot-auto-redeem';

  perform cron.schedule(
    'kingshot-auto-redeem',
    '* * * * *',
    v_command
  );
end
$$;
