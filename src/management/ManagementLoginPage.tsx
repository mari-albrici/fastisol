import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo'
import { useManagementAuth } from './AuthContext'
import { getManagementLoginEmail, isManagementConfigured, supabase } from './supabase'

export function ManagementLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { session, loading } = useManagementAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from ?? '/gestionale'

  useEffect(() => {
    if (!loading && session) navigate(destination, { replace: true })
  }, [destination, loading, navigate, session])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: getManagementLoginEmail(username),
      password,
    })

    if (authError) {
      setError('Username o password non corretti.')
      setSubmitting(false)
      return
    }

    navigate(destination, { replace: true })
  }

  return (
    <main className="management-login">
      <section className="management-login__panel" aria-labelledby="login-title">
        <Link className="management-login__brand" to="/">
          <BrandLogo variant="onLight" />
        </Link>
        <div className="management-login__heading">
          <span>Area riservata</span>
          <h1 id="login-title">Accedi al gestionale</h1>
          <p>Clienti, preventivi e fatture proforma in un unico spazio protetto.</p>
        </div>

        {!isManagementConfigured ? (
          <div className="management-alert management-alert--warning" role="alert">
            Il gestionale deve essere configurato prima dell’accesso. Consulta la guida nel file README.
          </div>
        ) : (
          <form className="management-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              <span>Username</span>
              <input autoComplete="username" autoFocus required value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              <span>Password</span>
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <div className="management-alert management-alert--error" role="alert">{error}</div>}
            <button className="management-primary-button management-primary-button--wide" type="submit" disabled={submitting}>
              {submitting ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </form>
        )}
        <Link className="management-login__back" to="/">← Torna al sito Fastisol</Link>
      </section>
      <aside className="management-login__visual" aria-hidden="true">
        <div>
          <span>Fastisol</span>
          <p>Il lavoro di ogni giorno,<br />organizzato con semplicità.</p>
        </div>
      </aside>
    </main>
  )
}
