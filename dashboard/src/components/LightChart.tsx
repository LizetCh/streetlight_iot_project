import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RANGES } from '../hooks/useSeries'
import { fmtDay, fmtDayTime, fmtTime } from '../lib/format'
import type { Alert, Range, SeriesPoint, Settings } from '../lib/types'

export const COLOR_A = '#F2F3F5'
export const COLOR_B = '#5CC8FF'

type Props = {
  range: Range
  points: SeriesPoint[]
  since: number
  until: number
  alerts: Alert[]
  settings: Settings
  error: string | null
}

export function LightChart({ range, points, since, until, alerts, settings, error }: Props) {
  // Sombrea los periodos con alerta que caen dentro del rango visible
  const bands = alerts
    .map((a) => ({
      id: a.id,
      x1: Math.max(new Date(a.started_at).getTime(), since),
      x2: Math.min(a.resolved_at ? new Date(a.resolved_at).getTime() : until, until),
    }))
    .filter((b) => b.x2 > b.x1)

  const tickFmt = (v: number) => (range === '7d' ? fmtDay(v) : fmtTime(v))

  return (
    <div className="panel chart-card">
      <div className="row-between wrap">
        <div className="stack-4">
          <h3>Intensidad de luz</h3>
          <span className="muted">{RANGES[range].label}</span>
        </div>
        <div className="legend">
          <span>
            <i style={{ background: COLOR_A }} />
            Poste A
          </span>
          <span>
            <i style={{ background: COLOR_B }} />
            Poste B
          </span>
          <span>
            <i className="legend-band" />
            Alerta
          </span>
        </div>
      </div>

      {error ? (
        <p className="empty">No se pudo cargar la gráfica: {error}</p>
      ) : points.length === 0 ? (
        <p className="empty">Todavía no hay lecturas en este rango.</p>
      ) : (
        <div className="chart" role="img" aria-label={`Gráfica de intensidad de luz de ambos postes, ${RANGES[range].label}`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#24262B" vertical={false} />
              {bands.map((b) => (
                <ReferenceArea key={b.id} x1={b.x1} x2={b.x2} fill="#FF6A3D" fillOpacity={0.14} stroke="none" ifOverflow="hidden" />
              ))}
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={[since, until]}
                tickFormatter={tickFmt}
                stroke="#8A8F98"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2E3036' }}
                minTickGap={32}
              />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#8A8F98" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ReferenceLine
                y={settings.bright_threshold}
                stroke="#6B6F78"
                strokeDasharray="6 5"
                strokeOpacity={0.7}
                label={{ value: `Umbral día ${settings.bright_threshold}%`, position: 'insideTopRight', fill: '#A3A8B0', fontSize: 11 }}
              />
              <ReferenceLine
                y={settings.dark_threshold}
                stroke="#6B6F78"
                strokeDasharray="6 5"
                strokeOpacity={0.7}
                label={{ value: `Umbral oscuridad ${settings.dark_threshold}%`, position: 'insideTopRight', fill: '#A3A8B0', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: '#1E2024', border: 'none', borderRadius: 10, color: '#F2F3F5', fontFamily: 'Inter, sans-serif' }}
                labelFormatter={(v) => fmtDayTime(Number(v))}
                formatter={(value, name) => [`${value}%`, name === 'a' ? 'Poste A' : 'Poste B']}
              />
              <Line type="monotone" dataKey="b" stroke={COLOR_B} strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="a" stroke={COLOR_A} strokeWidth={2.2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
