import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { BusinessDocument, SalesPayment } from './types'
import { clientDisplayName, formatCurrency, formatDate, todayIso } from './utils'

const emptyForm = { document_id: '', kind: 'partial', due_date: todayIso(), amount: 0, paid_date: '', payment_method: 'Bonifico', notes: '' }

export function ManagementReceivablesPage() {
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [payments, setPayments] = useState<SalesPayment[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const [documentResult, paymentResult] = await Promise.all([
      supabase.from('documents').select('*, clients(company_name, contact_name)').is('deleted_at',null).in('type', ['invoice', 'proforma']).neq('status', 'cancelled').order('issue_date', { ascending: false }),
      supabase.from('sales_payments').select('*').is('deleted_at',null).order('due_date'),
    ])
    if (documentResult.error || paymentResult.error) setError('Lo scadenzario incassi richiede la migrazione 20260830_full_operations.sql.')
    else {
      setDocuments((documentResult.data ?? []).map((item) => ({ ...item, total: Number(item.total) })) as BusinessDocument[])
      setPayments((paymentResult.data ?? []).map((item) => ({ ...item, amount: Number(item.amount) })) as SalesPayment[])
    }
    setLoading(false)
  }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const totals = useMemo(() => {
    const invoiced = documents.reduce((sum, document) => sum + document.total, 0)
    const collected = payments.filter((payment) => payment.paid_date).reduce((sum, payment) => sum + payment.amount, 0)
    const overdue = payments.filter((payment) => !payment.paid_date && payment.due_date < todayIso()).reduce((sum, payment) => sum + payment.amount, 0)
    return { invoiced, collected, outstanding: Math.max(0, invoiced - collected), overdue }
  }, [documents, payments])

  const openNew = (document?: BusinessDocument) => {
    const existing = document ? payments.filter((item) => item.document_id === document.id).reduce((sum, item) => sum + item.amount, 0) : 0
    setForm({ ...emptyForm, document_id: document?.id ?? '', due_date: document?.expiry_date ?? todayIso(), amount: document ? Math.max(0, document.total - existing) : 0 })
    setModalOpen(true); setError('')
  }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const document = documents.find((item) => item.id === form.document_id)
    const { error: saveError } = await supabase.from('sales_payments').insert({ ...form, project_id: document?.project_id ?? null, paid_date: form.paid_date || null, amount: Number(form.amount) })
    if (saveError) setError('Non è stato possibile registrare la scadenza/incasso.')
    else { setModalOpen(false); await load() }
    setSaving(false)
  }
  const markPaid = async (payment: SalesPayment) => { const { error: updateError } = await supabase.from('sales_payments').update({ paid_date: todayIso() }).eq('id', payment.id); if (updateError) setError('Aggiornamento non riuscito.'); else await load() }
  const remove = async (payment: SalesPayment) => { if (!window.confirm('Spostare questa scadenza nel cestino?')) return; await supabase.from('sales_payments').update({deleted_at:new Date().toISOString()}).eq('id', payment.id); await load() }

  return <div>
    <div className="management-page-heading"><div><span>Flussi finanziari</span><h1>Incassi e insoluti</h1><p>Acconti, pagamenti parziali, saldi e scadenze non incassate.</p></div><button className="management-primary-button" onClick={() => openNew()}><ManagementIcon name="plus" /> Nuova scadenza</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <div className="management-stats"><article><span>Fatturato / proforma</span><strong>{formatCurrency(totals.invoiced)}</strong><ManagementIcon name="documents" /></article><article><span>Incassato</span><strong>{formatCurrency(totals.collected)}</strong><ManagementIcon name="dashboard" /></article><article><span>Da incassare</span><strong>{formatCurrency(totals.outstanding)}</strong><ManagementIcon name="calendar" /></article><article><span>Scaduto</span><strong className="is-negative">{formatCurrency(totals.overdue)}</strong><ManagementIcon name="calendar" /></article></div>
    <section className="management-card"><div className="management-table-wrap"><table className="management-table management-table--receivables"><thead><tr><th>Documento</th><th>Cliente</th><th>Tipo rata</th><th>Scadenza</th><th className="is-number">Importo</th><th>Pagamento</th><th>Stato</th><th /></tr></thead><tbody>{payments.map((payment) => { const document = documents.find((item) => item.id === payment.document_id); const overdue = !payment.paid_date && payment.due_date < todayIso(); return <tr key={payment.id}><td>{document ? <Link className="management-table__main" to={`/gestionale/documenti/${document.id}`}>{document.number}</Link> : 'Documento eliminato'}</td><td>{document?.clients ? clientDisplayName(document.clients) : '—'}</td><td>{payment.kind === 'deposit' ? 'Acconto' : payment.kind === 'balance' ? 'Saldo' : 'Parziale'}</td><td>{formatDate(payment.due_date)}</td><td className="is-number"><strong>{formatCurrency(payment.amount)}</strong></td><td>{payment.paid_date ? formatDate(payment.paid_date) : '—'}<small>{payment.payment_method}</small></td><td><span className={`management-badge ${payment.paid_date ? 'status-paid' : overdue ? 'status-cancelled' : 'status-sent'}`}>{payment.paid_date ? 'Incassato' : overdue ? 'Insoluto' : 'Da incassare'}</span></td><td><div className="management-row-actions">{!payment.paid_date && <button title="Segna incassato" onClick={() => void markPaid(payment)}><ManagementIcon name="dashboard" /></button>}<button className="is-danger" onClick={() => void remove(payment)}><ManagementIcon name="trash" /></button></div></td></tr> })}</tbody></table></div>{!loading && payments.length === 0 && <div className="management-empty">Nessuna scadenza registrata.</div>}</section>

    <section className="management-card management-receivable-documents"><div className="management-card__header"><div><h2>Documenti senza piano completo</h2><p>Aggiungi acconti o saldo direttamente dal documento.</p></div></div><div className="management-table-wrap"><table className="management-table"><thead><tr><th>Documento</th><th>Cliente</th><th>Data</th><th className="is-number">Totale</th><th className="is-number">Pianificato</th><th /></tr></thead><tbody>{documents.map((document) => { const scheduled = payments.filter((item) => item.document_id === document.id).reduce((sum, item) => sum + item.amount, 0); return <tr key={document.id}><td><Link className="management-table__main" to={`/gestionale/documenti/${document.id}`}>{document.number}</Link></td><td>{document.clients ? clientDisplayName(document.clients) : '—'}</td><td>{formatDate(document.issue_date)}</td><td className="is-number">{formatCurrency(document.total)}</td><td className="is-number">{formatCurrency(scheduled)}</td><td><button className="management-secondary-button" onClick={() => openNew(document)}>Aggiungi rata</button></td></tr> })}</tbody></table></div></section>

    {modalOpen && <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" onClick={() => setModalOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Incasso</span><h2>Nuova scadenza</h2></div><button onClick={() => setModalOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void save(event)}><label className="is-wide"><span>Documento *</span><select required value={form.document_id} onChange={(event) => setForm((c) => ({ ...c, document_id: event.target.value }))}><option value="">Seleziona</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.number} · {document.clients ? clientDisplayName(document.clients) : ''}</option>)}</select></label><label><span>Tipo</span><select value={form.kind} onChange={(event) => setForm((c) => ({ ...c, kind: event.target.value }))}><option value="deposit">Acconto</option><option value="partial">Parziale</option><option value="balance">Saldo</option></select></label><label><span>Importo *</span><input required type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={(event) => setForm((c) => ({ ...c, amount: Number(event.target.value) }))} /></label><label><span>Scadenza *</span><input required type="date" value={form.due_date} onChange={(event) => setForm((c) => ({ ...c, due_date: event.target.value }))} /></label><label><span>Data incasso</span><input type="date" value={form.paid_date} onChange={(event) => setForm((c) => ({ ...c, paid_date: event.target.value }))} /></label><label><span>Metodo</span><input value={form.payment_method} onChange={(event) => setForm((c) => ({ ...c, payment_method: event.target.value }))} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={form.notes} onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))} /></label><div className="management-form__actions is-wide"><button type="button" className="management-secondary-button" onClick={() => setModalOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva scadenza'}</button></div></form></div></div>}
  </div>
}
