import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SETTINGS } from '../lib/rules'
import type { Settings } from '../lib/types'

// Umbrales (tabla settings, una sola fila). El trigger usa los mismos valores.
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else if (data) setSettings(data as Settings)
      })
  }, [])

  const save = useCallback(async (values: Pick<Settings, 'dark_threshold' | 'bright_threshold' | 'diff_threshold'>) => {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .maybeSingle()
    if (error) return error.message
    if (data) setSettings(data as Settings)
    return null
  }, [])

  return { settings, error, save }
}
