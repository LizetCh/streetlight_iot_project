// La regla OFICIAL vive en la base de datos (trigger detect_anomaly).
// Aquí solo se replica para pintar estados en pantalla; las alertas siempre salen de la tabla alerts.
import type { Alert, Pole, Reading, Settings } from './types'
import { ago, fmtTime } from './format'

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  dark_threshold: 20,
  bright_threshold: 60,
  diff_threshold: 40,
  updated_at: '',
}

export type Light = 'dark' | 'bright' | 'mid'
export type PoleState = 'offline' | 'alert' | 'day' | 'night' | 'mid'

export function lightLevel(pct: number, s: Settings): Light {
  if (pct <= s.dark_threshold) return 'dark'
  if (pct >= s.bright_threshold) return 'bright'
  return 'mid'
}

// Igual que el trigger: ¿qué poste está oscuro mientras su vecino tiene luz?
export function anomalousPole(a: number, b: number, s: Settings): Pole | null {
  if (Math.abs(a - b) < s.diff_threshold) return null
  if (a <= s.dark_threshold && b >= s.bright_threshold) return 'A'
  if (b <= s.dark_threshold && a >= s.bright_threshold) return 'B'
  return null
}

export function poleState(pct: number, hasOpenAlert: boolean, offline: boolean, s: Settings): PoleState {
  if (offline) return 'offline'
  if (hasOpenAlert) return 'alert'
  const l = lightLevel(pct, s)
  return l === 'bright' ? 'day' : l === 'dark' ? 'night' : 'mid'
}

export const POLE_STATE_LABEL: Record<PoleState, string> = {
  offline: 'Sin conexión',
  alert: 'Anomalía',
  day: 'Normal · Día',
  night: 'Normal · Noche',
  mid: 'Normal · Transición',
}

export type Verdict = {
  tone: 'anomaly' | 'ok' | 'offline' | 'empty'
  kicker: string
  title: string
  desc: string
}

export function systemVerdict(args: {
  latest: Reading | null
  openAlerts: Alert[]
  settings: Settings
  offline: boolean
  now: number
}): Verdict {
  const { latest, openAlerts, settings: s, offline, now } = args

  if (!latest) {
    return {
      tone: 'empty',
      kicker: 'SIN DATOS',
      title: 'Esperando la primera lectura',
      desc: 'Enciende el ESP32 o corre el simulador: uv run scripts/simulate.py',
    }
  }

  const a = Number(latest.pole_a_pct)
  const b = Number(latest.pole_b_pct)
  const diff = Math.round(Math.abs(a - b))

  if (offline) {
    return {
      tone: 'offline',
      kicker: 'SIN CONEXIÓN',
      title: 'El ESP32 dejó de enviar lecturas',
      desc: `Última lectura ${ago(latest.created_at, now)} (${fmtTime(latest.created_at)}). Revisa la alimentación y el Wi-Fi.`,
    }
  }

  const alert = openAlerts[0]
  if (alert) {
    const dark = alert.pole
    const other: Pole = dark === 'A' ? 'B' : 'A'
    const darkPct = Math.round(dark === 'A' ? a : b)
    const otherPct = Math.round(dark === 'A' ? b : a)
    const stillBad = anomalousPole(a, b, s) === dark
    return {
      tone: 'anomaly',
      kicker: 'ANOMALÍA LOCALIZADA',
      title: `Obstrucción sospechada en Poste ${dark}`,
      desc: stillBad
        ? `Poste ${dark} lee oscuridad (${darkPct}%) mientras Poste ${other}, su vecino, registra luz (${otherPct}%). No es de noche: la diferencia de ${diff} pts supera el umbral de ${s.diff_threshold}.`
        : `Alerta abierta desde las ${fmtTime(alert.started_at)}. Las lecturas ya volvieron a la normalidad; márquenla como reparada cuando la cuadrilla lo confirme.`,
    }
  }

  // Lectura anómala sin alerta abierta: se acaba de cerrar una alerta pero el sensor sigue tapado,
  // o el trigger todavía no la abre. La siguiente lectura abrirá una alerta nueva.
  const live = anomalousPole(a, b, s)
  if (live) {
    const other: Pole = live === 'A' ? 'B' : 'A'
    const darkPct = Math.round(live === 'A' ? a : b)
    const otherPct = Math.round(live === 'A' ? b : a)
    return {
      tone: 'anomaly',
      kicker: 'ANOMALÍA EN CURSO',
      title: `Poste ${live} sigue oscuro`,
      desc: `Poste ${live} lee ${darkPct}% mientras Poste ${other} registra ${otherPct}%. Si ya se marcó como reparado, revisen el sensor: la siguiente lectura abrirá una alerta nueva.`,
    }
  }

  const la = lightLevel(a, s)
  const lb = lightLevel(b, s)
  if (la === 'bright' && lb === 'bright') {
    return {
      tone: 'ok',
      kicker: 'SISTEMA NORMAL · DÍA',
      title: 'Ambos postes registran luz de día',
      desc: `Poste A (${Math.round(a)}%) y Poste B (${Math.round(b)}%) coinciden. Diferencia de ${diff} pts, dentro del umbral de ${s.diff_threshold}.`,
    }
  }
  if (la === 'dark' && lb === 'dark') {
    return {
      tone: 'ok',
      kicker: 'SISTEMA NORMAL · NOCHE',
      title: 'Ambos postes registran oscuridad',
      desc: `Es de noche: Poste A (${Math.round(a)}%) y Poste B (${Math.round(b)}%) coinciden, así que no es una falla.`,
    }
  }
  return {
    tone: 'ok',
    kicker: 'SISTEMA NORMAL',
    title: 'Lecturas en transición',
    desc: `Poste A ${Math.round(a)}% · Poste B ${Math.round(b)}%. La diferencia (${diff} pts) no alcanza para considerarla anomalía.`,
  }
}

export const CAUSES = ['Rama / hojas', 'Suciedad', 'Ave', 'Otra'] as const
