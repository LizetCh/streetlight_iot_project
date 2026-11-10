# Dashboard — Alumbrado inteligente

React + TypeScript + Vite. Lee de Supabase en tiempo real y permite cerrar alertas.

## Correrlo

```bash
cd dashboard
npm install
cp .env.example .env.local   # pon la URL y la llave PÚBLICA de Supabase
npm run dev                  # abre http://localhost:5173
```

Entra con un usuario creado en Supabase → Authentication → Users.

Para ver datos sin el ESP32, en otra terminal (desde la raíz del repo):

```bash
uv run scripts/simulate.py   # luego escribe a + Enter para tapar el Poste A
```

## Estructura

```
src/
├── lib/
│   ├── supabase.ts     # cliente (solo llave pública) y tiempo para "Sin conexión"
│   ├── types.ts        # tipos de las tablas
│   ├── rules.ts        # copia de la regla del trigger, solo para pintar estados
│   └── format.ts       # horas en zona America/Merida
├── hooks/              # un hook por fuente de datos, con Realtime
│   ├── useLatestReading.ts   useSeries.ts   useAlerts.ts
│   └── useSettings.ts        useReports.ts  useSession.ts  useNow.ts
├── components/         # una pieza del diseño por archivo
│   ├── Dashboard.tsx   # arma la pantalla
│   ├── VerdictBanner, KpiRow, PoleCard, DiffGauge, LightChart, PoleMap
│   ├── AlertsPanel     # abiertas/resueltas + "Marcar como reparado"
│   ├── AiReportColumn  # columna derecha del reporte IA
│   └── ThresholdsCard  # calibrar umbrales en sitio
└── styles.css          # colores y layout del diseño (oscuro, ámbar, azul/naranja)
```

## Reglas importantes

- **Las alertas las abre la base de datos** (trigger `detect_anomaly`), no el frontend. `rules.ts` solo replica la regla para colorear tarjetas.
- **Nunca pongas la llave secreta** (`sb_secret_...`) en `.env.local`: todo lo que empieza con `VITE_` se ve en el navegador.
- El botón **Generar reporte de hoy** llama a la Edge Function `daily-report`. Mientras no exista (Fase 4), muestra un aviso y no pasa nada más.
- La columna de IA espera que `ai_reports.events` tenga esta forma:
  `[{ "start": "16:05", "end": "16:46", "kind": "anomaly", "text": "Obstrucción en Poste B" }]`

## Deploy (Vercel)

Root Directory = `dashboard`, agrega las variables `VITE_` del `.env.example`, y registra la URL de Vercel en Supabase → Authentication → URL Configuration.
