import { useState } from 'react'
import type { Settings } from '../lib/types'

type Props = {
  settings: Settings
  onSave: (v: Pick<Settings, 'dark_threshold' | 'bright_threshold' | 'diff_threshold'>) => Promise<string | null>
}

// Calibración en sitio: cambia la fila de settings que usa el trigger.
// Dashboard la reinicia (key) una sola vez, cuando llegan los valores reales de la base de datos.
export function ThresholdsCard({ settings, onSave }: Props) {
  const [dark, setDark] = useState(String(settings.dark_threshold))
  const [bright, setBright] = useState(String(settings.bright_threshold))
  const [diff, setDiff] = useState(String(settings.diff_threshold))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save() {
    const d = Number(dark)
    const b = Number(bright)
    const f = Number(diff)
    const valid = [d, b, f].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)
    if (!valid) return setMsg({ ok: false, text: 'Usa números enteros entre 0 y 100.' })
    if (d >= b) return setMsg({ ok: false, text: 'El umbral de oscuridad debe ser menor que el de luz.' })
    const err = await onSave({ dark_threshold: d, bright_threshold: b, diff_threshold: f })
    setMsg(err ? { ok: false, text: `No se pudo guardar: ${err}` } : { ok: true, text: 'Guardado. El trigger ya usa los nuevos valores.' })
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          set(e.target.value)
          setMsg(null)
        }}
      />
    </div>
  )

  return (
    <section id="umbrales" className="panel">
      <div className="stack-4">
        <h3>Umbrales</h3>
        <span className="muted">Ajústalos con la luz real del salón. Valores en % de luz.</span>
      </div>
      <div className="thresholds">
        {field('th-dark', 'Oscuro si es ≤', dark, setDark)}
        {field('th-bright', 'Luz si es ≥', bright, setBright)}
        {field('th-diff', 'Diferencia mínima', diff, setDiff)}
        <button type="button" className="btn btn-ghost" onClick={save}>
          Guardar umbrales
        </button>
      </div>
      {msg && (
        <p className={msg.ok ? 'form-ok' : 'form-error'} role="status">
          {msg.text}
        </p>
      )}
    </section>
  )
}
