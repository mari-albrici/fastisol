import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { Expense, Project, PurchaseDocument, Supplier } from './types'
import { formatCurrency, formatDate, todayIso } from './utils'

const bucket = 'accounting-files'
const emptyPurchase = { supplier_id: '', project_id: '', kind: 'invoice', number: '', issue_date: todayIso(), due_date: '', taxable_amount: 0, tax_amount: 0, total: 0, paid_amount: 0, payment_date: '', notes: '' }
const emptyExpense = { project_id: '', supplier_id: '', category: 'other', expense_date: todayIso(), description: '', amount: 0, payment_method: '', notes: '' }

export function ManagementAccountingPage() {
  const { session } = useManagementAuth()
  const [tab, setTab] = useState<'purchases' | 'expenses'>('purchases')
  const [purchases, setPurchases] = useState<PurchaseDocument[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [purchaseForm, setPurchaseForm] = useState({ ...emptyPurchase })
  const [expenseForm, setExpenseForm] = useState({ ...emptyExpense })
  const [file, setFile] = useState<File | null>(null)
  const [modal, setModal] = useState<'purchase' | 'expense' | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const [purchaseResult, expenseResult, supplierResult, projectResult] = await Promise.all([
      supabase.from('purchase_documents').select('*, suppliers(company_name, contact_name), projects(code, name)').is('deleted_at',null).order('issue_date', { ascending: false }),
      supabase.from('expenses').select('*, suppliers(company_name, contact_name), projects(code, name)').is('deleted_at',null).order('expense_date', { ascending: false }),
      supabase.from('suppliers').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
      supabase.from('projects').select('*').is('deleted_at',null).order('code'),
    ])
    if (purchaseResult.error || expenseResult.error) setError('La contabilità richiede la migrazione 20260830_full_operations.sql.')
    else {
      setPurchases((purchaseResult.data ?? []).map((item) => ({ ...item, taxable_amount: Number(item.taxable_amount), tax_amount: Number(item.tax_amount), total: Number(item.total), paid_amount: Number(item.paid_amount) })) as PurchaseDocument[])
      setExpenses((expenseResult.data ?? []).map((item) => ({ ...item, amount: Number(item.amount) })) as Expense[])
    }
    if (!supplierResult.error) setSuppliers((supplierResult.data ?? []) as Supplier[])
    if (!projectResult.error) setProjects((projectResult.data ?? []) as Project[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const stats = useMemo(() => {
    const purchaseTotal = purchases.reduce((sum, item) => sum + (item.kind === 'credit_note' ? -item.total : item.total), 0)
    const purchasePaid = purchases.reduce((sum, item) => sum + (item.kind === 'credit_note' ? -item.paid_amount : item.paid_amount), 0)
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0)
    return { purchaseTotal, purchasePaid, outstanding: purchaseTotal - purchasePaid, expenseTotal }
  }, [expenses, purchases])

  const openPurchase = () => { setPurchaseForm({ ...emptyPurchase, issue_date: todayIso() }); setFile(null); setModal('purchase'); setError('') }
  const openExpense = () => { setExpenseForm({ ...emptyExpense, expense_date: todayIso() }); setFile(null); setModal('expense'); setError('') }

  const upload = async (): Promise<{ file_name: string | null; file_path: string | null; file_type: string | null; file_size: number | null }> => {
    if (!file || !session) return { file_name: null, file_path: null, file_type: null, file_size: null }
    if (file.size > 20 * 1024 * 1024) throw new Error('Il file supera 20 MB.')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream' })
    if (uploadError) throw new Error('Caricamento allegato non riuscito.')
    return { file_name: file.name, file_path: path, file_type: file.type, file_size: file.size }
  }

  const savePurchase = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const attachment = await upload()
      const payload = { ...purchaseForm, supplier_id: purchaseForm.supplier_id, project_id: purchaseForm.project_id || null, due_date: purchaseForm.due_date || null, payment_date: purchaseForm.payment_date || null, taxable_amount: Number(purchaseForm.taxable_amount), tax_amount: Number(purchaseForm.tax_amount), total: Number(purchaseForm.total), paid_amount: Number(purchaseForm.paid_amount), ...attachment }
      const { error: saveError } = await supabase.from('purchase_documents').insert(payload)
      if (saveError) { if (attachment.file_path) await supabase.storage.from(bucket).remove([attachment.file_path]); throw new Error('Non è stato possibile salvare la fattura passiva.') }
      setModal(null); await load()
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Salvataggio non riuscito.') }
    setSaving(false)
  }

  const saveExpense = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const attachment = await upload()
      const payload = { ...expenseForm, project_id: expenseForm.project_id || null, supplier_id: expenseForm.supplier_id || null, amount: Number(expenseForm.amount), ...attachment }
      const { error: saveError } = await supabase.from('expenses').insert(payload)
      if (saveError) { if (attachment.file_path) await supabase.storage.from(bucket).remove([attachment.file_path]); throw new Error('Non è stato possibile salvare la spesa.') }
      setModal(null); await load()
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Salvataggio non riuscito.') }
    setSaving(false)
  }

  const markPaid = async (item: PurchaseDocument) => { const { error: updateError } = await supabase.from('purchase_documents').update({ paid_amount: item.total, payment_date: todayIso() }).eq('id', item.id); if (updateError) setError('Aggiornamento non riuscito.'); else await load() }
  const removeRecord = async (table: 'purchase_documents' | 'expenses', record: PurchaseDocument | Expense) => { if (!window.confirm('Spostare questa registrazione nel cestino? L’allegato resterà recuperabile.')) return; const { error: deleteError } = await supabase.from(table).update({deleted_at:new Date().toISOString()}).eq('id', record.id); if (deleteError) setError('Archiviazione non riuscita.'); else await load() }
  const download = async (record: PurchaseDocument | Expense) => { if (!record.file_path) return; const { data } = await supabase.storage.from(bucket).download(record.file_path); if (!data) return; const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = record.file_name || 'allegato'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }

  return <div>
    <div className="management-page-heading"><div><span>Ciclo passivo</span><h1>Contabilità acquisti</h1><p>Fatture fornitori, ricevute, spese e pagamenti.</p></div><button className="management-primary-button" onClick={tab === 'purchases' ? openPurchase : openExpense}><ManagementIcon name="plus" /> {tab === 'purchases' ? 'Nuova fattura passiva' : 'Nuova spesa'}</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <div className="management-stats"><article><span>Fatture passive</span><strong>{formatCurrency(stats.purchaseTotal)}</strong><ManagementIcon name="documents" /></article><article><span>Pagato fornitori</span><strong>{formatCurrency(stats.purchasePaid)}</strong><ManagementIcon name="dashboard" /></article><article><span>Da pagare</span><strong>{formatCurrency(stats.outstanding)}</strong><ManagementIcon name="calendar" /></article><article><span>Altre spese</span><strong>{formatCurrency(stats.expenseTotal)}</strong><ManagementIcon name="note" /></article></div>
    <section className="management-card"><div className="management-tabs management-tabs--card"><button className={tab === 'purchases' ? 'is-active' : undefined} onClick={() => setTab('purchases')}>Fatture passive</button><button className={tab === 'expenses' ? 'is-active' : undefined} onClick={() => setTab('expenses')}>Spese</button></div>{loading ? <div className="management-empty">Caricamento…</div> : tab === 'purchases' ? <PurchaseTable items={purchases} onPaid={markPaid} onDownload={download} onDelete={(item) => removeRecord('purchase_documents', item)} /> : <ExpenseTable items={expenses} onDownload={download} onDelete={(item) => removeRecord('expenses', item)} />}</section>

    {modal === 'purchase' && <Modal title="Nuova fattura passiva" close={() => setModal(null)}><form className="management-form management-form--grid" onSubmit={(event) => void savePurchase(event)}><label><span>Fornitore *</span><select required value={purchaseForm.supplier_id} onChange={(event) => setPurchaseForm((c) => ({ ...c, supplier_id: event.target.value }))}><option value="">Seleziona</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{supplierName(item)}</option>)}</select></label><label><span>Commessa</span><select value={purchaseForm.project_id} onChange={(event) => setPurchaseForm((c) => ({ ...c, project_id: event.target.value }))}><option value="">Nessuna</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Tipo</span><select value={purchaseForm.kind} onChange={(event) => setPurchaseForm((c) => ({ ...c, kind: event.target.value }))}><option value="invoice">Fattura</option><option value="credit_note">Nota di credito</option><option value="receipt">Ricevuta</option><option value="other">Altro</option></select></label><label><span>Numero *</span><input required value={purchaseForm.number} onChange={(event) => setPurchaseForm((c) => ({ ...c, number: event.target.value }))} /></label><label><span>Data *</span><input required type="date" value={purchaseForm.issue_date} onChange={(event) => setPurchaseForm((c) => ({ ...c, issue_date: event.target.value }))} /></label><label><span>Scadenza</span><input type="date" value={purchaseForm.due_date} onChange={(event) => setPurchaseForm((c) => ({ ...c, due_date: event.target.value }))} /></label><Money label="Imponibile" value={purchaseForm.taxable_amount} set={(value) => setPurchaseForm((c) => ({ ...c, taxable_amount: value, total: value + c.tax_amount }))} /><Money label="IVA" value={purchaseForm.tax_amount} set={(value) => setPurchaseForm((c) => ({ ...c, tax_amount: value, total: c.taxable_amount + value }))} /><Money label="Totale" value={purchaseForm.total} set={(value) => setPurchaseForm((c) => ({ ...c, total: value }))} /><Money label="Già pagato" value={purchaseForm.paid_amount} set={(value) => setPurchaseForm((c) => ({ ...c, paid_amount: value }))} /><label><span>Data pagamento</span><input type="date" value={purchaseForm.payment_date} onChange={(event) => setPurchaseForm((c) => ({ ...c, payment_date: event.target.value }))} /></label><label><span>Allegato PDF/XML</span><input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={purchaseForm.notes} onChange={(event) => setPurchaseForm((c) => ({ ...c, notes: event.target.value }))} /></label><Actions saving={saving} cancel={() => setModal(null)} /></form></Modal>}
    {modal === 'expense' && <Modal title="Nuova spesa" close={() => setModal(null)}><form className="management-form management-form--grid" onSubmit={(event) => void saveExpense(event)}><label><span>Commessa</span><select value={expenseForm.project_id} onChange={(event) => setExpenseForm((c) => ({ ...c, project_id: event.target.value }))}><option value="">Nessuna</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Fornitore</span><select value={expenseForm.supplier_id} onChange={(event) => setExpenseForm((c) => ({ ...c, supplier_id: event.target.value }))}><option value="">Nessuno</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{supplierName(item)}</option>)}</select></label><label><span>Categoria</span><select value={expenseForm.category} onChange={(event) => setExpenseForm((c) => ({ ...c, category: event.target.value }))}>{Object.entries(expenseLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Data *</span><input required type="date" value={expenseForm.expense_date} onChange={(event) => setExpenseForm((c) => ({ ...c, expense_date: event.target.value }))} /></label><label className="is-wide"><span>Descrizione *</span><input required value={expenseForm.description} onChange={(event) => setExpenseForm((c) => ({ ...c, description: event.target.value }))} /></label><Money label="Importo *" value={expenseForm.amount} set={(value) => setExpenseForm((c) => ({ ...c, amount: value }))} /><label><span>Metodo pagamento</span><input value={expenseForm.payment_method} onChange={(event) => setExpenseForm((c) => ({ ...c, payment_method: event.target.value }))} /></label><label className="is-wide"><span>Allegato</span><input type="file" accept=".pdf,.xml,image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={expenseForm.notes} onChange={(event) => setExpenseForm((c) => ({ ...c, notes: event.target.value }))} /></label><Actions saving={saving} cancel={() => setModal(null)} /></form></Modal>}
  </div>
}

function PurchaseTable({ items, onPaid, onDownload, onDelete }: { items: PurchaseDocument[]; onPaid: (item: PurchaseDocument) => void; onDownload: (item: PurchaseDocument) => void; onDelete: (item: PurchaseDocument) => void }) { return items.length ? <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Documento</th><th>Fornitore</th><th>Commessa</th><th>Scadenza</th><th className="is-number">Totale</th><th className="is-number">Residuo</th><th>Stato</th><th /></tr></thead><tbody>{items.map((item) => { const outstanding = item.total - item.paid_amount; const overdue = outstanding > 0 && Boolean(item.due_date && item.due_date < todayIso()); return <tr key={item.id}><td><strong>{item.number}</strong><small>{formatDate(item.issue_date)}</small></td><td>{item.suppliers ? supplierName(item.suppliers) : '—'}</td><td>{item.projects ? `${item.projects.code} · ${item.projects.name}` : '—'}</td><td>{formatDate(item.due_date)}</td><td className="is-number">{formatCurrency(item.total)}</td><td className="is-number">{formatCurrency(outstanding)}</td><td><span className={`management-badge ${outstanding <= 0 ? 'status-paid' : overdue ? 'status-cancelled' : 'status-sent'}`}>{outstanding <= 0 ? 'Pagata' : overdue ? 'Scaduta' : item.paid_amount > 0 ? 'Parziale' : 'Da pagare'}</span></td><td><div className="management-row-actions">{outstanding > 0 && <button title="Segna pagata" onClick={() => void onPaid(item)}><ManagementIcon name="dashboard" /></button>}{item.file_path && <button onClick={() => void onDownload(item)}><ManagementIcon name="download" /></button>}<button className="is-danger" onClick={() => void onDelete(item)}><ManagementIcon name="trash" /></button></div></td></tr> })}</tbody></table></div> : <div className="management-empty">Nessuna fattura passiva.</div> }
function ExpenseTable({ items, onDownload, onDelete }: { items: Expense[]; onDownload: (item: Expense) => void; onDelete: (item: Expense) => void }) { return items.length ? <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th>Commessa</th><th>Fornitore</th><th className="is-number">Importo</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDate(item.expense_date)}</td><td><strong>{item.description}</strong><small>{item.payment_method}</small></td><td>{expenseLabels[item.category]}</td><td>{item.projects ? item.projects.code : '—'}</td><td>{item.suppliers ? supplierName(item.suppliers) : '—'}</td><td className="is-number"><strong>{formatCurrency(item.amount)}</strong></td><td><div className="management-row-actions">{item.file_path && <button onClick={() => void onDownload(item)}><ManagementIcon name="download" /></button>}<button className="is-danger" onClick={() => void onDelete(item)}><ManagementIcon name="trash" /></button></div></td></tr>)}</tbody></table></div> : <div className="management-empty">Nessuna spesa.</div> }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" onClick={close} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Contabilità</span><h2>{title}</h2></div><button onClick={close}><ManagementIcon name="x" /></button></div>{children}</div></div> }
function Money({ label, value, set }: { label: string; value: number; set: (value: number) => void }) { return <label><span>{label}</span><input type="number" min="0" step="0.01" value={value || ''} onChange={(event) => set(Number(event.target.value))} /></label> }
function Actions({ saving, cancel }: { saving: boolean; cancel: () => void }) { return <div className="management-form__actions is-wide"><button type="button" className="management-secondary-button" onClick={cancel}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</button></div> }
function supplierName(item: Pick<Supplier, 'company_name' | 'contact_name'>) { return item.company_name || item.contact_name || 'Fornitore' }
const expenseLabels: Record<string,string> = { material: 'Materiale', labor: 'Manodopera', travel: 'Trasferta', equipment: 'Attrezzatura', service: 'Servizio', tax: 'Imposta', other: 'Altro' }
