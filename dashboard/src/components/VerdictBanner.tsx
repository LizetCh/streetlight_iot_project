import type { Verdict } from '../lib/rules'
import { IconAlert, IconCheck, IconWifiOff } from './Icons'

export function VerdictBanner({ verdict }: { verdict: Verdict }) {
  const icon =
    verdict.tone === 'anomaly' ? <IconAlert size={26} /> : verdict.tone === 'offline' ? <IconWifiOff /> : <IconCheck size={26} />
  return (
    <section className={`banner banner-${verdict.tone}`} aria-live="polite">
      <div className="banner-icon">{icon}</div>
      <div className="banner-body">
        <span className="banner-kicker">{verdict.kicker}</span>
        <h2>{verdict.title}</h2>
        <p>{verdict.desc}</p>
      </div>
      {verdict.tone === 'anomaly' && (
        <a href="#alertas" className="btn btn-outline-warn">
          Ver alerta
        </a>
      )}
    </section>
  )
}
