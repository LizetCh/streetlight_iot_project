import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useLatestReading } from '../hooks/useLatestReading'
import { useSeries, RANGES } from '../hooks/useSeries'
import { useAlerts } from '../hooks/useAlerts'
import { useSettings } from '../hooks/useSettings'
import { useReports } from '../hooks/useReports'
import { useNow } from '../hooks/useNow'
import { OFFLINE_AFTER_MS } from '../lib/supabase'
import { anomalousPole, poleState, systemVerdict } from '../lib/rules'
import type { Range } from '../lib/types'
import { Sidebar } from './Sidebar'
import { VerdictBanner } from './VerdictBanner'
import { KpiRow } from './KpiRow'
import { PoleCard } from './PoleCard'
import { DiffGauge } from './DiffGauge'
import { LightChart, COLOR_A, COLOR_B } from './LightChart'
import { PoleMap } from './PoleMap'
import { AlertsPanel } from './AlertsPanel'
import { AiReportColumn } from './AiReportColumn'
import { ThresholdsCard } from './ThresholdsCard'

export function Dashboard({ session }: { session: Session }) {
  const now = useNow()
  const [range, setRange] = useState<Range>('24h')

  const { latest, todayCount, error: readingError } = useLatestReading()
  const { settings, save: saveSettings } = useSettings()
  const { alerts, open, resolved, error: alertsError, resolve } = useAlerts()
  const series = useSeries(range, latest?.id)
  const { reports, generating, generate } = useReports()

  const offline = !!latest && now - new Date(latest.created_at).getTime() > OFFLINE_AFTER_MS
  const a = latest ? Number(latest.pole_a_pct) : null
  const b = latest ? Number(latest.pole_b_pct) : null
  const diff = a !== null && b !== null ? Math.abs(a - b) : null

  // Un poste se marca en anomalía si tiene alerta abierta O si la lectura actual lo delata
  const livePole = a !== null && b !== null ? anomalousPole(a, b, settings) : null
  const flaggedA = open.some((x) => x.pole === 'A') || livePole === 'A'
  const flaggedB = open.some((x) => x.pole === 'B') || livePole === 'B'
  const stateA = a === null ? 'offline' : poleState(a, flaggedA, offline, settings)
  const stateB = b === null ? 'offline' : poleState(b, flaggedB, offline, settings)
  const liveAnomaly = livePole !== null

  const verdict = systemVerdict({ latest, openAlerts: open, settings, offline, now })
  const email = session.user.email ?? ''
  const defaultResolver = email.split('@')[0] ?? ''

  const loadError = readingError ?? alertsError

  return (
    <div className="app">
      <Sidebar openCount={open.length} latest={latest} offline={offline} now={now} userEmail={email} />

      <main id="resumen" className="main">
        <div className="main-inner">
          <header className="header">
            <div className="stack-6">
              <span className="muted">Calle 60 x 59, Centro · Mérida</span>
              <h1>Resumen del sistema</h1>
            </div>
            <div className="row wrap">
              <span className={`live-pill ${offline || !latest ? 'off' : ''}`}>
                <span className="dot" /> {offline || !latest ? 'Sin señal' : 'En vivo'}
              </span>
              <div role="group" aria-label="Rango de tiempo" className="segmented">
                {(Object.keys(RANGES) as Range[]).map((r) => (
                  <button key={r} type="button" aria-pressed={range === r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
                    {RANGES[r].short}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {loadError && (
            <p className="form-error" role="alert">
              No se pudieron cargar los datos: {loadError}. Revisa que tu usuario tenga sesión y que las migraciones estén aplicadas.
            </p>
          )}

          <VerdictBanner verdict={verdict} />

          <KpiRow alerts={alerts} todayCount={todayCount} now={now} />

          <section id="postes" aria-label="Estado de postes" className="panel poles">
            <PoleCard
              name="Poste A"
              color={COLOR_A}
              pct={a}
              raw={latest?.pole_a_light ?? null}
              gpio={34}
              state={stateA}
              updatedAt={latest?.created_at ?? null}
              now={now}
            />
            <PoleCard
              name="Poste B"
              color={COLOR_B}
              pct={b}
              raw={latest?.pole_b_light ?? null}
              gpio={35}
              state={stateB}
              updatedAt={latest?.created_at ?? null}
              now={now}
            />
            <DiffGauge diff={diff} threshold={settings.diff_threshold} alarming={liveAnomaly} />
          </section>

          <section className="split">
            <LightChart
              range={range}
              points={series.points}
              since={series.since}
              until={series.until}
              alerts={alerts}
              settings={settings}
              error={series.error}
            />
            <PoleMap stateA={stateA} stateB={stateB} />
          </section>

          {/* En celular las alertas suben justo debajo del banner (CSS order en styles.css) */}
          <AlertsPanel
            open={open}
            resolved={resolved}
            latest={latest}
            now={now}
            defaultResolver={defaultResolver}
            onResolve={resolve}
          />

          <ThresholdsCard key={settings.updated_at ? 'loaded' : 'default'}settings={settings} onSave={saveSettings} />
        </div>
      </main>

      <AiReportColumn reports={reports} generating={generating} onGenerate={generate} />
    </div>
  )
}
