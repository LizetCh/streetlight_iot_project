type Props = { diff: number | null; threshold: number; alarming: boolean }

export function DiffGauge({ diff, threshold, alarming }: Props) {
  const width = diff === null ? 0 : Math.min(100, diff)
  return (
    <div className="cell pole">
      <div className="stack-4">
        <h3>Validación cruzada</h3>
        <span className="muted">Diferencia |A − B| entre vecinos</span>
      </div>
      <div className="row baseline">
        <span className={`big-num ${alarming ? 'text-warn' : 'text-ok'}`}>{diff === null ? '—' : Math.round(diff)}</span>
        <span className="muted">pts · umbral {threshold}</span>
      </div>
      <div className="bar gauge">
        <div className={`bar-fill ${alarming ? 'fill-warn' : 'fill-ok'}`} style={{ width: `${width}%` }} />
        <div className="gauge-mark" style={{ left: `${threshold}%` }} aria-hidden="true" />
      </div>
      <div className="row-between muted small">
        <span>0</span>
        <span>{threshold} · alerta</span>
        <span>100</span>
      </div>
    </div>
  )
}
