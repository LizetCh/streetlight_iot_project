import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Alert } from '../lib/types'

export type ResolveInput = { cause: string; note: string; resolvedBy: string }

// Alertas abiertas y resueltas. Las abre el trigger de la base de datos;
// aquí solo se leen y se cierran ("Marcar como reparado").
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100)
    if (error) setError(error.message)
    else {
      setError(null)
      setAlerts((data ?? []) as Alert[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('alerts:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const resolve = useCallback(
    async (id: number, input: ResolveInput): Promise<string | null> => {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: input.resolvedBy.trim() || null,
          cause: input.cause,
          note: input.note.trim() || null,
        })
        .eq('id', id)
      if (error) return error.message
      await load()
      return null
    },
    [load],
  )

  const open = alerts.filter((a) => a.status === 'open')
  const resolved = alerts.filter((a) => a.status === 'resolved')

  return { alerts, open, resolved, error, loading, resolve }
}
