import { POLE_STATE_LABEL } from '../lib/rules'
import type { PoleState } from '../lib/rules'
import { ago } from '../lib/format'

type Props = {
  name: string
  color: string
  pct: number | null
  raw: number | null
  gpio: number
  state: PoleState
  updatedAt: string | null
  now: number
}

export function PoleCard({ name, color, pct, raw, gpio, state, updatedAt, now }: Props) {
  const width = pct === null ? 0 : Math.max(0, Math.min(100, pct))
  return (
    <div className={`cell pole ${state === 'alert' ? 'is-alert' : ''}`}>
      <div className="row-between">
        <div className="row">
          <span className="swatch" style={{ background: color }} />
          <h3>{name}</h3>
        </div>
        <span className={`badge badge-${state}`}>{POLE_STATE_LABEL[state]}</span>
      </div>
      <div className="row baseline">
        <span className="big-num">{pct === null ? '—' : `${Math.round(pct)}%`}</span>
        <span className="muted">de luz</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="muted small">
        ADC {raw ?? '—'} · GPIO {gpio} · {updatedAt ? ago(updatedAt, now) : 'sin lecturas'}
      </span>
    </div>
  )
}
