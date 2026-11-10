import { supabase } from '../lib/supabase'
import { ago } from '../lib/format'
import type { Reading } from '../lib/types'
import { IconAlert, IconBulb, IconDoc, IconGrid, IconLogout, IconPole, IconSliders } from './Icons'

type Props = {
  openCount: number
  latest: Reading | null
  offline: boolean
  now: number
  userEmail: string | undefined
}

export function Sidebar({ openCount, latest, offline, now, userEmail }: Props) {
  const online = latest && !offline
  return (
    <nav className="sidebar" aria-label="Navegación principal">
      <div className="brand">
        <span className="brand-mark">
          <IconBulb />
        </span>
        <div className="brand-text">
          <strong>Alumbrado</strong>
          <span>Monitoreo IoT</span>
        </div>
      </div>

      <div className="nav">
        <a href="#resumen" className="nav-link active">
          <IconGrid /> Resumen
        </a>
        <a href="#postes" className="nav-link">
          <IconPole /> Postes
        </a>
        <a href="#alertas" className="nav-link">
          <IconAlert /> <span className="grow">Alertas</span>
          {openCount > 0 && <span className="count-badge">{openCount}</span>}
        </a>
        <a href="#reportes" className="nav-link">
          <IconDoc /> Reportes IA
        </a>
        <a href="#umbrales" className="nav-link">
          <IconSliders /> Umbrales
        </a>
      </div>

      <div className="device">
        <div className="device-title">
          <span className={`dot ${online ? 'dot-ok' : 'dot-off'}`} />
          {online ? 'ESP32 en línea' : 'ESP32 sin conexión'}
        </div>
        <span className="muted small">
          {latest ? `Última lectura ${ago(latest.created_at, now)}` : 'Sin lecturas todavía'}
        </span>
      </div>

      <div className="user">
        <span className="muted small truncate" title={userEmail}>
          {userEmail}
        </span>
        <button type="button" className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => supabase.auth.signOut()}>
          <IconLogout />
        </button>
      </div>
    </nav>
  )
}
