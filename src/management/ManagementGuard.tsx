import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useManagementAuth } from './AuthContext'

export function ManagementGuard() {
  const { session, loading } = useManagementAuth()
  const location = useLocation()

  if (loading) return <div className="management-loader" aria-label="Verifica accesso"><span /></div>
  if (!session) return <Navigate to="/gestionale/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

