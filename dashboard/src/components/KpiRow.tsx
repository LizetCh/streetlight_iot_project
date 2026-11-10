import { duration, isToday } from '../lib/format'
import type { Alert } from '../lib/types'
import { READING_INTERVAL_S } from '../lib/supabase'

type Props = { alerts: Alert[]; todayCount: number | null; now: number }

export function KpiRow({ alerts, todayCount, now }: Props) {
  const today = alerts.filter((a) => isToday(a.started_at))
  const open = alerts.filter((a) => a.status === 'open')
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const fixedThisWeek = alerts.filter((a) => a.resolved_at && new Date(a.resolved_at).getTime() >= weekAgo)
  const mttr =
    fixedThisWeek.length > 0
      ? fixedThisWeek.reduce((sum, a) => sum + (new Date(a.resolved_at!).getTime() - new Date(a.started_at).getTime()), 0) /
        fixedThisWeek.length
      : null

  return (
    <section className="panel kpis" aria-label="Indicadores">
      <Kpi label="Anomalías hoy" value={String(today.length)} note={`${open.length} abierta${open.length === 1 ? '' : 's'}`} />
      <Kpi
        label="Tiempo medio de reparación"
        value={mttr === null ? '—' : duration(mttr)}
        note={fixedThisWeek.length ? `${fixedThisWeek.length} reparadas en 7 días` : 'Sin reparaciones en 7 días'}
      />
      <Kpi label="Lecturas hoy" value={todayCount === null ? '—' : todayCount.toLocaleString('es-MX')} note={`1 cada ${READING_INTERVAL_S} s`} />
      <Kpi label="Alertas en historial" value={String(alerts.length)} note="Abiertas y resueltas" />
    </section>
  )
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="kpi">
      <span className="muted">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="muted small">{note}</span>
    </div>
  )
}
