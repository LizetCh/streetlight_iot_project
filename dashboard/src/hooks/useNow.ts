import { useEffect, useState } from 'react'

// Reloj que avanza cada segundo: sirve para "hace 4 s" y para detectar "Sin conexión".
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
