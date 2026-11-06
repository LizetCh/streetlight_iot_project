-- =====================================================================
-- Serie de lecturas agrupadas para la gráfica del dashboard
-- Supabase regresa máximo 1,000 filas por consulta; un día a 60 s son 1,440.
-- Esta función promedia las lecturas por intervalo para no pasarse del límite.
--
-- Uso desde React:
--   supabase.rpc('readings_series', { since: '2026-11-05T00:00:00-06:00', bucket: '10 minutes' })
--   1 h  -> '1 minute'   (60 puntos)
--   24 h -> '10 minutes' (144 puntos)
--   7 d  -> '1 hour'     (168 puntos)
--
-- Respeta RLS: solo usuarios con login (authenticated) pueden leerla.
-- =====================================================================

create or replace function public.readings_series(since timestamptz, bucket interval)
returns table (t timestamptz, a numeric, b numeric, readings int)
language sql
stable
security invoker
set search_path = public
as $$
  select date_bin(bucket, created_at, timestamptz '2000-01-01 00:00:00-06') as t,
         round(avg(pole_a_pct), 1)                                          as a,
         round(avg(pole_b_pct), 1)                                          as b,
         count(*)::int                                                      as readings
  from public.street_light_logs
  where created_at >= since
  group by 1
  order by 1;
$$;

revoke execute on function public.readings_series(timestamptz, interval) from public, anon;
grant  execute on function public.readings_series(timestamptz, interval) to authenticated, service_role;
