import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AiReport } from '../lib/types'

// Reportes diarios de IA. Los escribe ai_summary.py (GitHub Actions, 23:59) o la
// Edge Function "daily-report" (botón "Generar reporte de hoy").
export function useReports() {
  const [reports, setReports] = useState<AiReport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

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

  const generate = useCallback(async (): Promise<string | null> => {
    setGenerating(true)
    try {
      const { error } = await supabase.functions.invoke('daily-report', { body: {} })
      if (error) {
        console.error('daily-report failed:', error.message)
        return 'No se pudo generar el reporte. Intenta de nuevo en un momento.'
      }
      await load()
      return null
    } finally {
      setGenerating(false)
    }
  }, [load])

  return { reports, error, generating, generate }
}
