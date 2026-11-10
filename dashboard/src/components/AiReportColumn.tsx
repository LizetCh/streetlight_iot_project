import { useState } from 'react'
import { fmtReportDate, fmtTime } from '../lib/format'
import type { AiReport } from '../lib/types'
import { IconDoc, IconRefresh } from './Icons'

type Props = {
  reports: AiReport[]
  generating: boolean
  onGenerate: () => Promise<string | null>
}

export function AiReportColumn({ reports, generating, onGenerate }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const report = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null
  const history = reports.filter((r) => r.id !== report?.id)

  async function generate() {
    setMessage(null)
    const err = await onGenerate()
    if (err) setMessage(err)
    else setSelectedId(null)
  }

  async function copy() {
    if (!report) return
    const text = [
      `Reporte del ${fmtReportDate(report.report_date)}`,
      report.summary,
      ...(report.events ?? []).map((e) => `- ${e.start}${e.end ? `–${e.end}` : ''}: ${e.text}`),
      report.recommendation ? `Recomendación: ${report.recommendation}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage('No se pudo copiar. Selecciona el texto manualmente.')
    }
  }

  return (
    <aside id="reportes" className="ai-column" aria-label="Reporte diario con IA">
      <div className="row">
        <span className="ai-mark">
          <IconDoc size={20} />
        </span>
        <div className="stack-2">
          <h2>Reporte IA</h2>
          <span className="muted small">Resumen diario para la dirección municipal</span>
        </div>
      </div>

      <div className="stack-8">
        <button type="button" className="btn btn-primary btn-block" onClick={generate} disabled={generating}>
          <IconRefresh /> {generating ? 'Generando…' : 'Generar reporte de hoy'}
        </button>
        <span className="muted small">Analiza las lecturas del día. Una sola llamada a la IA por reporte; también corre solo a las 23:59.</span>
        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}
      </div>

      {report ? (
        <article className="report">
          <div className="stack-4">
            <span className="kicker-amber">{report.id === reports[0]?.id ? 'ÚLTIMO REPORTE' : 'REPORTE ANTERIOR'}</span>
            <h3>{fmtReportDate(report.report_date)}</h3>
            <span className="muted small">
              Generado {fmtTime(report.created_at)}
              {report.readings_count ? ` · ${report.readings_count.toLocaleString('es-MX')} lecturas analizadas` : ''}
            </span>
          </div>
          <div className="stack-6">
            <h4>Resumen</h4>
            <p>{report.summary}</p>
          </div>
          {report.events && report.events.length > 0 && (
            <div className="stack-10">
              <h4>Eventos del día</h4>
              {report.events.map((e, i) => (
                <div className="event" key={i}>
                  <span className={`dot ${e.kind === 'anomaly' ? 'dot-warn' : 'dot-ok'}`} />
                  <div className="stack-2">
                    <span className="mono muted small">
                      {e.start}
                      {e.end ? ` – ${e.end}` : ''}
                    </span>
                    <span>{e.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {report.recommendation && (
            <p className="recommendation">
              <strong>Recomendación:</strong> {report.recommendation}
            </p>
          )}
          <button type="button" className="btn btn-ghost" onClick={copy}>
            {copied ? 'Copiado' : 'Copiar reporte'}
          </button>
        </article>
      ) : (
        <div className="empty-box">
          <strong>Todavía no hay reportes</strong>
          <span className="muted">El primero aparecerá después de las 23:59, o al presionar “Generar reporte de hoy”.</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="stack-4">
          <h3 className="section-label">Reportes anteriores</h3>
          {history.map((r) => (
            <button type="button" key={r.id} className="history-btn" onClick={() => setSelectedId(r.id)}>
              <span>{fmtReportDate(r.report_date)}</span>
              {r.events && (
                <span className={r.events.some((e) => e.kind === 'anomaly') ? 'text-warn small' : 'text-ok small'}>
                  {r.events.some((e) => e.kind === 'anomaly') ? 'Con incidencias' : 'Sin incidencias'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
