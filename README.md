# Smart Streetlight IoT

Sistema de monitoreo de alumbrado público de bajo costo. Un ESP32 lee dos sensores de luz (LDR) que simulan postes vecinos y manda las lecturas a Supabase. Si un poste está oscuro mientras su vecino tiene luz de día, la base de datos abre una alerta de obstrucción. Un dashboard muestra todo en tiempo real y una IA genera un resumen diario.

```
ESP32 ──POST──▶ Supabase (PostgreSQL) ──Realtime──▶ Dashboard
                   │  trigger: detecta anomalías
                   └─ Función IA (23:59) ──▶ reporte diario
```

## Estructura del repo

```
streetlight_iot_project/
├── firmware/                  # Código del ESP32 (Arduino IDE, C++)
├── supabase/
│   ├── functions/             # Edge Functions (reporte diario con IA)
│   └── migrations/            # Esquema de la base de datos, en orden
│       ├── 20261105000000_init.sql             # Tablas, trigger, RLS, Realtime
│       └── 20261105010000_readings_series.sql  # Función para la gráfica
├── dashboard/                 # (pendiente) App en React + TypeScript
├── .env.example               # Variables de entorno, sin llaves reales
├── .gitignore
├── pyproject.toml             # Dependencias de Python (uv)
├── uv.lock
└── README.md
```

## Setup

Requiere [uv](https://docs.astral.sh/uv/).

```bash
uv sync
cp .env.example .env   # luego pon tus claves en .env
```

Correr un script:

```bash
uv run <script>.py
```

> **Nunca subas `.env` al repo.** Ya está en `.gitignore`.

## Base de datos


| Tabla | Qué guarda |
|---|---|
| `street_light_logs` | Cada lectura del ESP32 (valor crudo 0–4095 y % calculado) |
| `alerts` | Alertas de obstrucción. Solo una abierta por poste |
| `settings` | Umbrales: oscuro ≤ 20 %, luz ≥ 60 %, diferencia ≥ 40 |
| `ai_reports` | Un reporte de IA por día |

**Regla de anomalía** (trigger `detect_anomaly`): se ejecuta en cada lectura nueva.

| Poste A | Poste B | Resultado |
|---|---|---|
| Oscuro | Oscuro | Noche, normal |
| Con luz | Con luz | Día, normal |
| Oscuro | Con luz | Alerta en A |
| Con luz | Oscuro | Alerta en B |

**Cambios al esquema:** no edites un archivo de migración que ya se aplicó. Crea uno nuevo con fecha y hora al inicio del nombre (`AAAAMMDDHHMMSS_descripcion.sql`) y avisa al equipo.

### Llaves y permisos (RLS)

| Quién | Llave | Puede |
|---|---|---|
| ESP32 | Pública (`sb_publishable_...`) | Solo insertar lecturas |
| Dashboard | Pública + login de usuario | Leer todo, cerrar alertas, cambiar umbrales |
| Función IA | Secreta (`sb_secret_...`) | Todo. **Solo en el servidor, nunca en el ESP32 ni en el frontend** |

La llave pública va **solo** en el header `apikey`; no lleva `Authorization: Bearer`.

Prueba rápida desde la terminal (debe responder `201`):

```bash
curl -i -X POST "$SUPABASE_URL/rest/v1/street_light_logs" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pole_a_light":300,"pole_b_light":3500}'
```

## Estado y lo que sigue

### ✅ Fase 1 — Base de datos
- [x] Tablas, trigger de anomalías, RLS y Realtime
- [x] Función `readings_series` para la gráfica
- [x] API probada con `curl` (inserta `201`, lectura bloqueada `[]`)
- [x] Usuarios del dashboard creados, registro público desactivado

Las fases 2, 3 y 4 se pueden hacer **en paralelo**.

### Fase 2 — ESP32 (`firmware/`)
- [ ] Armar el circuito: `3.3V → LDR → nodo → 10kΩ → GND`. Poste A en GPIO 34, Poste B en GPIO 35
- [ ] Credenciales en `firmware/secrets.h` (en `.gitignore`)
- [ ] Corregir el JSON del código del PDF (se perdieron las diagonales de escape)
- [ ] HTTPS con `WiFiClientSecure` + `setInsecure()` (prototipo)
- [ ] Mandar la llave solo en `apikey`; quitar el header `Authorization`
- [ ] Intervalo de 5 s para la demo
- [ ] Calibrar los umbrales con la luz del salón

### Fase 3 — Dashboard (`dashboard/`)
- [ ] Proyecto Vite + React + TypeScript con `@supabase/supabase-js` y `recharts`
- [ ] Simulador de lecturas (sirve sin hardware y como plan B en el examen)
- [ ] Login con Supabase Auth
- [ ] Tarjetas de postes, banner de estado y gráfica en vivo
- [ ] Panel de alertas con "Marcar como reparado"
- [ ] Columna derecha con el reporte de IA
- [ ] Vista móvil para la cuadrilla
- [ ] Deploy en Vercel

### Fase 4 — Reporte IA (`supabase/functions/`)
- [ ] Edge Function `daily-report`
- [ ] Secreto `GEMINI_API_KEY` en Supabase
- [ ] Resumen del día guardado en `ai_reports`
- [ ] Programar a las 23:59 de Mérida (05:59 UTC) con `pg_cron`
- [ ] Botón "Generar reporte de hoy" en el dashboard

### Fase 5 — Prueba completa
- [ ] Dejar el sistema corriendo al menos 2 noches antes del examen
- [ ] Probar: tapar un sensor → alerta → reparar desde el celular → se cierra
- [ ] Probar: desconectar el ESP32 → "Sin conexión"

### Fase 6 — Demo del examen
- [ ] Ensayar el guion (menos de 3 minutos)
- [ ] Plan B: hotspot del celular, simulador, video grabado y un reporte de IA ya generado