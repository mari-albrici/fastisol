import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useManagementAuth } from './AuthContext'
import { supabase } from './supabase'

export function ManagementMfaPage(){
  const {session}=useManagementAuth();const [factorId,setFactorId]=useState('');const [code,setCode]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const navigate=useNavigate();const location=useLocation()
  const destination=(location.state as {from?:string}|null)?.from??'/gestionale'
  useEffect(()=>{const timer=window.setTimeout(()=>void supabase.auth.mfa.listFactors().then(({data})=>setFactorId(data?.totp.find(f=>f.status==='verified')?.id??'')),0);return()=>window.clearTimeout(timer)},[])
  if(!session)return <Navigate to="/gestionale/login" replace/>
  const submit=async(event:FormEvent)=>{event.preventDefault();setBusy(true);setError('');const challenge=await supabase.auth.mfa.challenge({factorId});if(challenge.error)setError('Impossibile creare la verifica.');else{const result=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});if(result.error)setError('Codice non valido.');else navigate(destination,{replace:true})}setBusy(false)}
  return <main className="management-login"><section className="management-login__panel"><div className="management-login__heading"><span>Sicurezza</span><h1>Verifica in due passaggi</h1><p>Inserisci il codice generato dalla tua app Authenticator.</p></div>{!factorId?<div className="management-alert management-alert--error">Nessun fattore verificato disponibile.</div>:<form className="management-form" onSubmit={event=>void submit(event)}><label><span>Codice a 6 cifre</span><input autoFocus required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))}/></label>{error&&<div className="management-alert management-alert--error">{error}</div>}<button className="management-primary-button" disabled={busy||code.length!==6}>{busy?'Verifica…':'Verifica accesso'}</button></form>}</section></main>
}
