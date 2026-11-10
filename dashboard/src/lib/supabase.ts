import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configError =
  !url || !key
    ? 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia dashboard/.env.example a dashboard/.env.local y llena los valores.'
    : null

// Solo la llave PÚBLICA. La secreta nunca va en el frontend.
export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'missing-key')

// Cada cuántos segundos manda el ESP32 (5 s en la demo, 60 s en "producción").
export const READING_INTERVAL_S = Number(import.meta.env.VITE_READING_INTERVAL_S ?? 5)

// Sin lecturas durante 3 intervalos = "Sin conexión".
export const OFFLINE_AFTER_MS = READING_INTERVAL_S * 3 * 1000
