import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AiReport } from '../lib/types'

// Reportes diarios de IA. Los escribe ai_summary.py desde GitHub Actions.
export function useReports() {
  const [reports, setReports] = useState<AiReport[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(10)
    if (error) setError(error.message)
    else {
      setError(null)
      setReports((data ?? []) as AiReport[])
    }
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('ai_reports:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_reports' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { reports, error }
}