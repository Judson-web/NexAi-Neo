-- Keep pg_net out of the exposed public schema without changing the scheduler API.
create schema if not exists net;

alter extension pg_net set schema net;

-- Recreate the scheduler command explicitly against the new extension schema.
do $$
declare
  v_command text := $cmd$
select net.http_post(
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
