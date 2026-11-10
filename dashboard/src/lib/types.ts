// Tipos que reflejan las tablas de supabase/migrations/20261105000000_init.sql

export type Pole = 'A' | 'B'

export type Reading = {
  id: number
  created_at: string
  pole_a_light: number // ADC crudo 0–4095
  pole_b_light: number
  pole_a_pct: number // % de luz calculado por la base de datos
  pole_b_pct: number
}

export type Alert = {
  id: number
  pole: Pole
  type: 'obstruction' | 'offline'
  status: 'open' | 'resolved'
  started_at: string
  last_seen_at: string
  resolved_at: string | null
  resolved_by: string | null
  cause: string | null
  note: string | null
  start_log_id: number | null
}

export type Settings = {
  id: number
  dark_threshold: number // % o menos = oscuro
  bright_threshold: number // % o más = luz
  diff_threshold: number // diferencia mínima entre postes
  updated_at: string
}

// Forma que debe escribir la Edge Function en ai_reports.events
export type AiEvent = {
  start: string // "16:05"
  end?: string // "16:46"
  kind: 'normal' | 'anomaly'
  text: string
}

export type AiReport = {
  id: number
  report_date: string // "2026-11-05"
  summary: string
  recommendation: string | null
  events: AiEvent[] | null
  readings_count: number | null
  model: string | null
  created_at: string
}

export type SeriesPoint = {
  ts: number // epoch ms
  a: number
  b: number
}

export type Range = '1h' | '24h' | '7d'
