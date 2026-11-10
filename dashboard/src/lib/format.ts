// Todo se muestra en hora de Mérida, sin importar la zona de la computadora.
export const TZ = 'America/Merida'

const timeFmt = new Intl.DateTimeFormat('es-MX', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
const dayFmt = new Intl.DateTimeFormat('es-MX', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' })
const dayTimeFmt = new Intl.DateTimeFormat('es-MX', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const longDayFmt = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const isoDayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

export const fmtTime = (d: string | number | Date) => timeFmt.format(new Date(d))
export const fmtDay = (d: string | number | Date) => dayFmt.format(new Date(d))
export const fmtDayTime = (d: string | number | Date) => dayTimeFmt.format(new Date(d))

// "2026-11-02" -> "domingo, 2 de noviembre"
export const fmtReportDate = (isoDate: string) => {
  const s = longDayFmt.format(new Date(`${isoDate}T12:00:00Z`))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Medianoche de hoy en Mérida (UTC-6, sin horario de verano)
export function startOfTodayISO(now = new Date()): string {
  const day = isoDayFmt.format(now) // "2026-11-05"
  return new Date(`${day}T00:00:00-06:00`).toISOString()
}

export function isToday(d: string, now = new Date()) {
  return isoDayFmt.format(new Date(d)) === isoDayFmt.format(now)
}

export function ago(fromIso: string, now: number): string {
  const s = Math.max(0, Math.round((now - new Date(fromIso).getTime()) / 1000))
  if (s < 60) return `hace ${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h ${m % 60} min`
  return `hace ${Math.floor(h / 24)} d`
}

export function duration(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60000))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`
}
