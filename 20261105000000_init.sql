-- =====================================================================
-- Smart Streetlight IoT — esquema inicial
-- Pegar completo en Supabase > SQL Editor > Run
-- (o guardar en supabase/migrations/ si usan la CLI)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN (umbrales editables desde el dashboard)
--    Una sola fila (id = 1). Valores en % de luz (0–100).
-- ---------------------------------------------------------------------
create table public.settings (
  id               int primary key default 1 check (id = 1),
  dark_threshold   int not null default 20 check (dark_threshold between 0 and 100),
  bright_threshold int not null default 60 check (bright_threshold between 0 and 100),
  diff_threshold   int not null default 40 check (diff_threshold between 0 and 100),
  updated_at       timestamptz not null default now()
);

insert into public.settings default values;


-- ---------------------------------------------------------------------
-- 2. LECTURAS DEL ESP32
--    El ESP32 manda los valores crudos del ADC (0–4095).
--    Los % se calculan solos (columnas generadas).
-- ---------------------------------------------------------------------
create table public.street_light_logs (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  pole_a_light int not null check (pole_a_light between 0 and 4095),
  pole_b_light int not null check (pole_b_light between 0 and 4095),
  pole_a_pct   numeric(4,1) generated always as (round(pole_a_light * 100.0 / 4095, 1)) stored,
  pole_b_pct   numeric(4,1) generated always as (round(pole_b_light * 100.0 / 4095, 1)) stored
);

create index street_light_logs_created_at_idx
  on public.street_light_logs (created_at desc);


-- ---------------------------------------------------------------------
-- 3. ALERTAS
--    Solo puede haber UNA alerta abierta por poste y tipo.
--    La cuadrilla la cierra desde el dashboard ("Marcar como reparado").
-- ---------------------------------------------------------------------
create table public.alerts (
  id            bigint generated always as identity primary key,
  pole          text not null check (pole in ('A', 'B')),
  type          text not null default 'obstruction' check (type in ('obstruction', 'offline')),
  status        text not null default 'open' check (status in ('open', 'resolved')),
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),   -- última lectura que confirmó la anomalía
  resolved_at   timestamptz,
  resolved_by   text,                                 -- ej. 'Cuadrilla 1'
  cause         text,                                 -- ej. 'Rama / hojas', 'Suciedad', 'Ave', 'Otra'
  note          text,
  start_log_id  bigint references public.street_light_logs (id) on delete set null
);

create unique index alerts_one_open_per_pole
  on public.alerts (pole, type)
  where status = 'open';


-- ---------------------------------------------------------------------
-- 4. REPORTES DE IA (los escribe la Edge Function una vez al día)
-- ---------------------------------------------------------------------
create table public.ai_reports (
  id              bigint generated always as identity primary key,
  report_date     date not null unique,
  summary         text not null,
  recommendation  text,
  events          jsonb,          -- lista de eventos del día para la columna derecha
  readings_count  int,
  model           text,           -- ej. 'gemini-2.5-flash'
  created_at      timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 5. REGLA DE VALIDACIÓN CRUZADA (trigger)
--    Se ejecuta en cada lectura nueva, aunque nadie tenga el dashboard abierto.
--      ambos oscuros            -> noche, normal
--      ambos con luz            -> día, normal
--      uno oscuro + otro con luz -> anomalía en el poste OSCURO
-- ---------------------------------------------------------------------
create or replace function public.detect_anomaly()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s          public.settings%rowtype;
  a          numeric := new.pole_a_light * 100.0 / 4095;
  b          numeric := new.pole_b_light * 100.0 / 4095;
  dark_pole  text;
begin
  select * into s from public.settings where id = 1;

  if abs(a - b) >= s.diff_threshold then
    if a <= s.dark_threshold and b >= s.bright_threshold then
      dark_pole := 'A';
    elsif b <= s.dark_threshold and a >= s.bright_threshold then
      dark_pole := 'B';
    end if;
  end if;

  if dark_pole is not null then
    -- Abre la alerta, o si ya hay una abierta solo actualiza last_seen_at
    insert into public.alerts (pole, type, start_log_id)
    values (dark_pole, 'obstruction', new.id)
    on conflict (pole, type) where status = 'open'
    do update set last_seen_at = now();
  end if;

  return new;
end;
$$;

create trigger street_light_logs_detect_anomaly
  after insert on public.street_light_logs
  for each row execute function public.detect_anomaly();


-- ---------------------------------------------------------------------
-- 6. SEGURIDAD (RLS)
--    - anon  (la llave que va en el ESP32): SOLO puede insertar lecturas.
--    - authenticated (usuarios con login en el dashboard): leer todo,
--      cerrar alertas y cambiar umbrales.
--    - La Edge Function de IA usa la service_role key y no necesita políticas.
--
--    Si NO van a poner login en el dashboard, cambien "to authenticated"
--    por "to anon, authenticated" en las políticas de select/update
--    (menos seguro, pero aceptable para la demo).
-- ---------------------------------------------------------------------
alter table public.street_light_logs enable row level security;
alter table public.alerts            enable row level security;
alter table public.ai_reports        enable row level security;
alter table public.settings          enable row level security;

-- Lecturas
create policy "esp32 puede insertar lecturas"
  on public.street_light_logs for insert
  to anon, authenticated
  with check (true);

create policy "dashboard lee lecturas"
  on public.street_light_logs for select
  to authenticated
  using (true);

-- Alertas
create policy "dashboard lee alertas"
  on public.alerts for select
  to authenticated
  using (true);

create policy "dashboard cierra alertas"
  on public.alerts for update
  to authenticated
  using (true)
  with check (true);

-- Reportes IA
create policy "dashboard lee reportes"
  on public.ai_reports for select
  to authenticated
  using (true);

-- Configuración
create policy "dashboard lee umbrales"
  on public.settings for select
  to authenticated
  using (true);

create policy "dashboard edita umbrales"
  on public.settings for update
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 7. TIEMPO REAL (para que el dashboard se actualice solo)
-- ---------------------------------------------------------------------
alter publication supabase_realtime
  add table public.street_light_logs, public.alerts, public.ai_reports;


-- =====================================================================
-- PRUEBA RÁPIDA (correr aparte, después de lo anterior)
-- =====================================================================
-- insert into public.street_light_logs (pole_a_light, pole_b_light) values (3500, 3520); -- día, normal
-- insert into public.street_light_logs (pole_a_light, pole_b_light) values (150, 160);   -- noche, normal
-- insert into public.street_light_logs (pole_a_light, pole_b_light) values (300, 3500);  -- ANOMALÍA Poste A
-- insert into public.street_light_logs (pole_a_light, pole_b_light) values (280, 3480);  -- misma alerta, no duplica
-- select * from public.alerts;   -- debe haber 1 alerta abierta en Poste A
--
-- Cerrar la alerta como lo hará el dashboard:
-- update public.alerts
--    set status = 'resolved', resolved_at = now(), resolved_by = 'Cuadrilla 1', cause = 'Rama / hojas'
--  where pole = 'A' and status = 'open';
--
-- Limpiar los datos de prueba:
-- truncate public.alerts, public.street_light_logs restart identity;
