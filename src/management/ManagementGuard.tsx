import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { useManagementAuth } from './AuthContext'

export function ManagementGuard() {
  const { session, loading } = useManagementAuth()
  const location = useLocation()
  const [mfa,setMfa]=useState<'loading'|'required'|'ok'>('loading')

  useEffect(()=>{if(!session)return;let active=true;void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({data})=>{if(active)setMfa(data?.nextLevel==='aal2'&&data.currentLevel!=='aal2'?'required':'ok')});return()=>{active=false}},[session,location.pathname])

  if (loading) return <div className="management-loader" aria-label="Verifica accesso"><span /></div>
  if (!session) return <Navigate to="/gestionale/login" replace state={{ from: location.pathname }} />
  if(mfa==='loading')return <div className="management-loader" aria-label="Verifica sicurezza"><span/></div>
  if(mfa==='required')return <Navigate to="/gestionale/mfa" replace state={{from:location.pathname}}/>
  return <Outlet />
}
