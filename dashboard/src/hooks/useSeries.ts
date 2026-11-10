import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Range, SeriesPoint } from '../lib/types'

export const RANGES: Record<Range, { ms: number; bucket: string; label: string; short: string }> = {
  '1h': { ms: 60 * 60 * 1000, bucket: '1 minute', label: 'Última hora · promedio por minuto', short: '1 h' },
  '24h': { ms: 24 * 60 * 60 * 1000, bucket: '10 minutes', label: 'Últimas 24 h · promedio cada 10 min', short: '24 h' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, bucket: '1 hour', label: 'Últimos 7 días · promedio por hora', short: '7 d' },
}

// Serie agrupada para la gráfica (función readings_series de la 2.ª migración).
// refreshKey cambia con cada lectura nueva para que la gráfica se mueva en vivo.
export function useSeries(range: Range, refreshKey: number | undefined) {
  const [points, setPoints] = useState<SeriesPoint[]>([])
  const [window_, setWindow] = useState(() => ({ since: Date.now() - RANGES[range].ms, until: Date.now() }))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      const until = Date.now()
      const since = until - RANGES[range].ms
      const { data, error } = await supabase.rpc('readings_series', {
        since: new Date(since).toISOString(),
        bucket: RANGES[range].bucket,
      })
      if (!active) return
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        const rows = (data ?? []) as { t: string; a: number | string; b: number | string }[]
        setPoints(rows.map((r) => ({ ts: new Date(r.t).getTime(), a: Number(r.a), b: Number(r.b) })))
      }
      setWindow({ since, until })
      setLoading(false)
    }, 400)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [range, refreshKey])

  return { points, since: window_.since, until: window_.until, error, loading }
}
