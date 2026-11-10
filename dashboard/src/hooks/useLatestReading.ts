import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { startOfTodayISO } from '../lib/format'
import type { Reading } from '../lib/types'

// Última lectura + cuántas van hoy. Se actualiza solo con Realtime.
export function useLatestReading() {
  const [latest, setLatest] = useState<Reading | null>(null)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const [last, count] = await Promise.all([
        supabase
          .from('street_light_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('street_light_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfTodayISO()),
      ])
      if (!active) return
      if (last.error) setError(last.error.message)
      else setLatest((last.data as Reading | null) ?? null)
      setTodayCount(count.count ?? 0)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('street_light_logs:insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'street_light_logs' }, (payload) => {
        setLatest(payload.new as Reading)
        setTodayCount((c) => (c ?? 0) + 1)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { latest, todayCount, loading, error }
}
