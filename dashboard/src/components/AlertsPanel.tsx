import { useState } from 'react'
import { CAUSES } from '../lib/rules'
import { duration, fmtDayTime, fmtTime } from '../lib/format'
import type { Alert, Reading } from '../lib/types'
import type { ResolveInput } from '../hooks/useAlerts'
import { IconCheck } from './Icons'

type Props = {
  open: Alert[]
  resolved: Alert[]
  latest: Reading | null
  now: number
  defaultResolver: string
  onResolve: (id: number, input: ResolveInput) => Promise<string | null>
}

export function AlertsPanel({ open, resolved, latest, now, defaultResolver, onResolve }: Props) {
  const [tab, setTab] = useState<'open' | 'resolved'>('open')

  return (
    <section id="alertas" className="panel alerts">
      <div className="row-between wrap">
        <h3>Alertas</h3>
        <div role="tablist" aria-label="Filtrar alertas" className="segmented">
          <button type="button" role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>
            Abiertas ({open.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'resolved'}
            className={tab === 'resolved' ? 'on' : ''}
            onClick={() => setTab('resolved')}
          >
            Resueltas ({resolved.length})
          </button>
        </div>
      </div>

      {tab === 'open' &&
        (open.length === 0 ? (
          <div className="empty-box">
            <strong>Sin alertas abiertas</strong>
            <span className="muted">Los dos postes operan con normalidad. Las nuevas anomalías aparecen aquí al instante.</span>
          </div>
        ) : (
          open.map((a) => (
            <OpenAlert key={a.id} alert={a} latest={latest} now={now} defaultResolver={defaultResolver} onResolve={onResolve} />
          ))
        ))}

      {tab === 'resolved' &&
        (resolved.length === 0 ? (
          <div className="empty-box">
            <strong>Todavía no hay alertas resueltas</strong>
            <span className="muted">Cuando la cuadrilla marque una alerta como reparada, quedará en este historial.</span>
          </div>
        ) : (
          <ul className="history">
            {resolved.map((a) => (
              <li key={a.id}>
                <span className="dot dot-ok" />
                <strong className="history-pole">Poste {a.pole}</strong>
                <span className="grow">
                  {fmtDayTime(a.started_at)}–{fmtTime(a.resolved_at!)} ·{' '}
                  {duration(new Date(a.resolved_at!).getTime() - new Date(a.started_at).getTime())}
                  {a.resolved_by ? ` · ${a.resolved_by}` : ''}
                </span>
                <span className="muted small">{[a.cause, a.note].filter(Boolean).join(' — ') || 'Sin causa registrada'}</span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}

function OpenAlert({
  alert,
  latest,
  now,
  defaultResolver,
  onResolve,
}: {
  alert: Alert
  latest: Reading | null
  now: number
  defaultResolver: string
  onResolve: Props['onResolve']
}) {
  const [cause, setCause] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [resolver, setResolver] = useState(defaultResolver)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const other = alert.pole === 'A' ? 'B' : 'A'
  const darkPct = latest ? Math.round(Number(alert.pole === 'A' ? latest.pole_a_pct : latest.pole_b_pct)) : null
  const otherPct = latest ? Math.round(Number(alert.pole === 'A' ? latest.pole_b_pct : latest.pole_a_pct)) : null

  async function submit() {
    if (!cause) {
      setError('Elige la causa encontrada antes de cerrar la alerta.')
      return
    }
    setBusy(true)
    const err = await onResolve(alert.id, { cause, note, resolvedBy: resolver })
    setBusy(false)
    if (err) setError(`No se pudo cerrar la alerta: ${err}`)
  }

  return (
    <article className="open-alert">
      <div className="row wrap">
        <span className="tag-warn">OBSTRUCCIÓN</span>
        <strong>Poste {alert.pole}</strong>
        <span className="muted">
          · desde {fmtTime(alert.started_at)} · {duration(now - new Date(alert.started_at).getTime())}
        </span>
      </div>
      <p>
        {darkPct !== null
          ? `Lectura actual: Poste ${alert.pole} ${darkPct}% · Poste ${other} ${otherPct}%. `
          : ''}
        Revisar la lente del sensor: rama, polvo o excremento de ave.
      </p>

      <div className="resolve">
        <span className="label" id={`cause-${alert.id}`}>
          Causa encontrada
        </span>
        <div className="chips" role="group" aria-labelledby={`cause-${alert.id}`}>
          {CAUSES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${cause === c ? 'on' : ''}`}
              aria-pressed={cause === c}
              onClick={() => {
                setCause(c)
                setError(null)
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="resolve-fields">
          <div className="field">
            <label htmlFor={`who-${alert.id}`}>Reparado por</label>
            <input id={`who-${alert.id}`} value={resolver} onChange={(e) => setResolver(e.target.value)} />
          </div>
          <div className="field grow">
            <label htmlFor={`note-${alert.id}`}>Nota (opcional)</label>
            <input
              id={`note-${alert.id}`}
              placeholder="Ej. se retiró una rama del árbol"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
          <IconCheck /> {busy ? 'Guardando…' : 'Marcar como reparado'}
        </button>
      </div>
    </article>
  )
}
