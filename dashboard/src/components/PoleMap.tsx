import type { PoleState } from '../lib/rules'

const FILL: Record<PoleState, string> = {
  alert: '#FF6A3D',
  offline: '#6B6F78',
  day: '#C5F82A',
  night: '#C5F82A',
  mid: '#C5F82A',
}

// Mapa esquemático (sin servicios externos): Calle 60 x 59, Centro, Mérida.
export function PoleMap({ stateA, stateB }: { stateA: PoleState; stateB: PoleState }) {
  return (
    <div className="panel map-card">
      <div className="stack-4">
        <h3>Ubicación de postes</h3>
        <span className="muted">10 m entre postes</span>
      </div>
      <svg
        role="img"
        aria-label={`Mapa: Poste A (${stateA === 'alert' ? 'con anomalía' : 'normal'}) y Poste B (${stateB === 'alert' ? 'con anomalía' : 'normal'}) sobre Calle 60`}
        viewBox="0 0 320 250"
        className="map"
      >
        <rect x="0" y="0" width="320" height="250" fill="#141518" />
        <g fill="#1B1D21">
          <rect x="12" y="12" width="110" height="88" rx="6" />
          <rect x="172" y="12" width="136" height="88" rx="6" />
          <rect x="12" y="140" width="110" height="98" rx="6" />
          <rect x="172" y="140" width="136" height="98" rx="6" />
        </g>
        <rect x="122" y="0" width="50" height="250" fill="#22242A" />
        <rect x="0" y="100" width="320" height="40" fill="#22242A" />
        <line x1="147" y1="0" x2="147" y2="250" stroke="#34373E" strokeWidth="2" strokeDasharray="8 8" />
        <text x="20" y="124" fill="#8A8F98" fontSize="11">
          Calle 59
        </text>
        <text x="178" y="234" fill="#8A8F98" fontSize="11">
          Calle 60
        </text>
        {stateA === 'alert' && <circle cx="172" cy="62" r="18" fill="rgba(255,106,61,0.28)" />}
        <circle cx="172" cy="62" r="9" fill={FILL[stateA]} stroke="#141518" strokeWidth="3" />
        <text x="190" y="66" fill="#F2F3F5" fontSize="12" fontWeight="700">
          A
        </text>
        {stateB === 'alert' && <circle cx="172" cy="178" r="18" fill="rgba(255,106,61,0.28)" />}
        <circle cx="172" cy="178" r="9" fill={FILL[stateB]} stroke="#141518" strokeWidth="3" />
        <text x="190" y="182" fill="#F2F3F5" fontSize="12" fontWeight="700">
          B
        </text>
      </svg>
      <div className="legend small">
        <span>
          <i className="round" style={{ background: '#C5F82A' }} />
          Normal
        </span>
        <span>
          <i className="round" style={{ background: '#FF6A3D' }} />
          Anomalía
        </span>
        <span>
          <i className="round" style={{ background: '#6B6F78' }} />
          Sin conexión
        </span>
      </div>
    </div>
  )
}
