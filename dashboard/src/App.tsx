import { configError } from './lib/supabase'
import { useSession } from './hooks/useSession'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const { session, loading } = useSession()

  if (configError) {
    return (
      <div className="login">
        <div className="login-card">
          <h1>Falta configuración</h1>
          <p className="form-error">{configError}</p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Cargando…</div>
  if (!session) return <Login />
  return <Dashboard session={session} />
}
