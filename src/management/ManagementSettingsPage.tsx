import { useEffect, useState, type FormEvent } from 'react'
import { useManagementAuth } from './AuthContext'
import { supabase } from './supabase'
import type { DocumentNumberSetting, DocumentType, InvoiceSettings } from './types'
import { company } from '../data/company'
import { fiscalRegimes } from './fiscalRegimes'

const defaults = (year: number): Record<DocumentType, DocumentNumberSetting> => ({
  quote: { year, type: 'quote', prefix: 'PREV', next_number: 1, padding: 3 },
  proforma: { year, type: 'proforma', prefix: 'PRO', next_number: 1, padding: 3 },
  invoice: { year, type: 'invoice', prefix: 'FT', next_number: 1, padding: 3 },
})

const invoiceDefaults: InvoiceSettings = {
  denomination: company.legalName, tax_code: '', vat_number: company.vatNumber, fiscal_regime: '',
  address: company.address.street, postal_code: company.address.postalCode, city: company.address.city,
  province: company.address.province, country: 'IT', iban: '', transmission_sequence: 1,
}

export function ManagementSettingsPage() {
  const { session } = useManagementAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [settings, setSettings] = useState(defaults(year))
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(invoiceDefaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([supabase.from('document_number_settings').select('*').eq('year', year), supabase.from('invoice_settings').select('*').maybeSingle()]).then(([numberResult, invoiceResult]) => {
        if (numberResult.error) setError('Non è stato possibile caricare le impostazioni. Verifica la migrazione Supabase.')
        else {
          const next = defaults(year)
          for (const item of (numberResult.data ?? []) as DocumentNumberSetting[]) next[item.type] = item
          setSettings(next)
          if (invoiceResult.data) setInvoiceSettings(invoiceResult.data as InvoiceSettings)
          if (invoiceResult.error) setError('Esegui la migrazione di aggiornamento per configurare FatturaPA.')
          else setError('')
        }
        setLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [year])

  const update = (type: DocumentType, field: 'prefix' | 'next_number' | 'padding', value: string | number) => setSettings((current) => ({ ...current, [type]: { ...current[type], [field]: value } }))
  const updateInvoice = <K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => setInvoiceSettings((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); if (!session) return; setSaving(true); setMessage(''); setError('')
    const rows = Object.values(settings).map((setting) => ({ owner_id: session.user.id, year, type: setting.type, prefix: setting.prefix.trim().toUpperCase(), next_number: Number(setting.next_number), padding: Number(setting.padding) }))
    const { error: saveError } = await supabase.from('document_number_settings').upsert(rows, { onConflict: 'owner_id,year,type' })
    const invoicePayload = { ...invoiceSettings, owner_id: session.user.id }
    const { error: invoiceError } = await supabase.from('invoice_settings').upsert(invoicePayload, { onConflict: 'owner_id' })
    if (saveError || invoiceError) setError('Non è stato possibile salvare tutte le impostazioni. Verifica la migrazione Supabase.')
    else setMessage('Impostazioni salvate. Saranno usate dai prossimi documenti e dagli XML FatturaPA.')
    setSaving(false)
  }

  return <div>
    <div className="management-page-heading"><div><span>Configurazione</span><h1>Impostazioni</h1><p>Prefissi e numerazione progressiva separati per anno.</p></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}{message && <div className="management-alert management-alert--success">{message}</div>}
    <form className="management-settings" onSubmit={(event) => void handleSubmit(event)}>
      <section className="management-card document-form-section"><div className="management-settings__year"><div><h2>Anno di numerazione</h2><p>Ogni anno mantiene progressivi indipendenti.</p></div><input type="number" min="2000" max="2200" value={year} onChange={(event) => { setLoading(true); setYear(Number(event.target.value)) }} /></div></section>
      {(['quote', 'proforma', 'invoice'] as const).map((type) => <section className="management-card document-form-section" key={type}><h2>{type === 'quote' ? 'Preventivi' : type === 'proforma' ? 'Fatture proforma' : 'Fatture fiscali esportate'}</h2>{type === 'invoice' && <p className="management-settings__description">Progressivo fiscale assegnato nella finestra prima di creare l’XML. È indipendente dal numero della proforma.</p>}<div className="management-form management-form--numbering">
        <label><span>Prefisso</span><input required maxLength={12} value={settings[type].prefix} onChange={(event) => update(type, 'prefix', event.target.value)} /></label>
        <label><span>Prossimo numero</span><input required type="number" min="1" value={settings[type].next_number} onChange={(event) => update(type, 'next_number', Number(event.target.value))} /></label>
        <label><span>Cifre</span><input required type="number" min="1" max="8" value={settings[type].padding} onChange={(event) => update(type, 'padding', Number(event.target.value))} /></label>
        <div className="management-number-preview"><span>Anteprima</span><strong>{settings[type].prefix || '—'}-{year}-{String(settings[type].next_number).padStart(settings[type].padding, '0')}</strong></div>
      </div></section>)}
      <section className="management-card document-form-section"><h2>Dati XML da caricare su Aruba</h2><p className="management-settings__description"><strong>Il gestionale non invia fatture elettroniche allo SDI.</strong> Questi dati vengono inseriti negli XML fiscali generati dalle proforma, che devono essere caricati, controllati e inviati da Aruba Fatturazione. Il regime fiscale va confermato con il commercialista.</p><div className="management-form management-form--grid">
        <label className="is-wide"><span>Denominazione *</span><input required value={invoiceSettings.denomination} onChange={(event) => updateInvoice('denomination', event.target.value)} /></label>
        <label><span>Partita IVA *</span><input required value={invoiceSettings.vat_number} onChange={(event) => updateInvoice('vat_number', event.target.value)} /></label><label><span>Codice fiscale *</span><input required value={invoiceSettings.tax_code} onChange={(event) => updateInvoice('tax_code', event.target.value.toUpperCase())} /></label>
        <label><span>Regime fiscale *</span><select required value={invoiceSettings.fiscal_regime} onChange={(event) => updateInvoice('fiscal_regime', event.target.value)}><option value="">Seleziona</option>{fiscalRegimes.map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select></label><label><span>IBAN</span><input value={invoiceSettings.iban} onChange={(event) => updateInvoice('iban', event.target.value)} /></label>
        <label className="is-wide"><span>Indirizzo *</span><input required value={invoiceSettings.address} onChange={(event) => updateInvoice('address', event.target.value)} /></label><label><span>CAP *</span><input required value={invoiceSettings.postal_code} onChange={(event) => updateInvoice('postal_code', event.target.value)} /></label><label><span>Comune *</span><input required value={invoiceSettings.city} onChange={(event) => updateInvoice('city', event.target.value)} /></label><label><span>Provincia *</span><input required maxLength={2} value={invoiceSettings.province} onChange={(event) => updateInvoice('province', event.target.value.toUpperCase())} /></label><label><span>Nazione *</span><input required maxLength={2} value={invoiceSettings.country} onChange={(event) => updateInvoice('country', event.target.value.toUpperCase())} /></label><label><span>Prossimo progressivo XML *</span><input required type="number" min="1" value={invoiceSettings.transmission_sequence} onChange={(event) => updateInvoice('transmission_sequence', Number(event.target.value))} /></label>
      </div></section>
      <div className="management-settings__actions"><button className="management-primary-button" disabled={saving || loading}>{saving ? 'Salvataggio…' : 'Salva impostazioni'}</button></div>
    </form>
  </div>
}
