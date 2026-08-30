import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { projectStatusLabels, type BusinessDocument, type Client, type Expense, type Project, type ProjectStatus, type PurchaseDocument } from './types'
import { clientDisplayName, formatCurrency, formatDate, todayIso } from './utils'

const emptyProject = { client_id: '', code: '', name: '', address: '', city: '', province: '', start_date: todayIso(), end_date: '', status: 'planned' as ProjectStatus, area_sqm: 0, planned_revenue: 0, estimated_material_cost: 0, estimated_labor_cost: 0, estimated_travel_cost: 0, estimated_other_cost: 0, labor_cost: 0, travel_cost: 0, other_cost: 0, notes: '' }

export function ManagementProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [purchases, setPurchases] = useState<PurchaseDocument[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyProject })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [projectResult, clientResult, documentResult, purchaseResult, expenseResult] = await Promise.all([
      supabase.from('projects').select('*, clients(company_name, contact_name)').is('deleted_at',null).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
      supabase.from('documents').select('*').is('deleted_at',null).not('project_id', 'is', null),
      supabase.from('purchase_documents').select('*').is('deleted_at',null).not('project_id', 'is', null),
      supabase.from('expenses').select('*').is('deleted_at',null).not('project_id', 'is', null),
    ])
    if (projectResult.error) setError('Non è stato possibile caricare le commesse. Esegui la migrazione Supabase 20260830_full_operations.sql.')
    else {
      const normalized = (projectResult.data ?? []).map((project) => ({ ...project, labor_cost: Number(project.labor_cost), travel_cost: Number(project.travel_cost), other_cost: Number(project.other_cost), area_sqm:Number(project.area_sqm||0),planned_revenue:Number(project.planned_revenue||0),estimated_material_cost:Number(project.estimated_material_cost||0),estimated_labor_cost:Number(project.estimated_labor_cost||0),estimated_travel_cost:Number(project.estimated_travel_cost||0),estimated_other_cost:Number(project.estimated_other_cost||0) })) as Project[]
      setProjects(normalized); setSelectedId((current) => current && normalized.some((item) => item.id === current) ? current : normalized[0]?.id ?? null)
    }
    if (!clientResult.error) setClients((clientResult.data ?? []) as Client[])
    if (!documentResult.error) setDocuments((documentResult.data ?? []).map(normalizeDocument) as BusinessDocument[])
    if (!purchaseResult.error) setPurchases((purchaseResult.data ?? []).map((item) => ({ ...item, total: Number(item.total) })) as PurchaseDocument[])
    if (!expenseResult.error) setExpenses((expenseResult.data ?? []).map((item) => ({ ...item, amount: Number(item.amount) })) as Expense[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])
  const selected = projects.find((project) => project.id === selectedId) ?? null

  const metrics = useMemo(() => new Map(projects.map((project) => {
    const revenue = documents.filter((document) => document.project_id === project.id && document.type === 'proforma' && document.status !== 'cancelled').reduce((sum, document) => sum + document.total, 0)
    const supplierCosts = purchases.filter((item) => item.project_id === project.id).reduce((sum, item) => sum + (item.kind === 'credit_note' ? -item.total : item.total), 0)
    const otherExpenses = expenses.filter((item) => item.project_id === project.id).reduce((sum, item) => sum + item.amount, 0)
    const costs = supplierCosts + otherExpenses + project.labor_cost + project.travel_cost + project.other_cost
    const plannedRevenue=Number(project.planned_revenue||documents.filter(document=>document.project_id===project.id&&document.type==='quote'&&document.approved).reduce((sum,document)=>sum+document.total,0));const estimatedCosts=Number(project.estimated_material_cost||0)+Number(project.estimated_labor_cost||0)+Number(project.estimated_travel_cost||0)+Number(project.estimated_other_cost||0)
    return [project.id, { revenue, costs, margin: revenue - costs,plannedRevenue,estimatedCosts,estimatedMargin:plannedRevenue-estimatedCosts }]
  })), [documents, expenses, projects, purchases])

  const openNew = () => { setEditingId(null); setForm({ ...emptyProject, code: `COM-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`, start_date: todayIso() }); setModalOpen(true); setError('') }
  const openEdit = (project: Project) => { setEditingId(project.id); setForm({ client_id: project.client_id, code: project.code, name: project.name, address: project.address, city: project.city, province: project.province, start_date: project.start_date ?? '', end_date: project.end_date ?? '', status: project.status, area_sqm:Number(project.area_sqm||0),planned_revenue:Number(project.planned_revenue||0),estimated_material_cost:Number(project.estimated_material_cost||0),estimated_labor_cost:Number(project.estimated_labor_cost||0),estimated_travel_cost:Number(project.estimated_travel_cost||0),estimated_other_cost:Number(project.estimated_other_cost||0), labor_cost: project.labor_cost, travel_cost: project.travel_cost, other_cost: project.other_cost, notes: project.notes }); setModalOpen(true); setError('') }

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null, area_sqm:Number(form.area_sqm),planned_revenue:Number(form.planned_revenue),estimated_material_cost:Number(form.estimated_material_cost),estimated_labor_cost:Number(form.estimated_labor_cost),estimated_travel_cost:Number(form.estimated_travel_cost),estimated_other_cost:Number(form.estimated_other_cost), labor_cost: Number(form.labor_cost), travel_cost: Number(form.travel_cost), other_cost: Number(form.other_cost) }
    const query = editingId ? supabase.from('projects').update(payload).eq('id', editingId) : supabase.from('projects').insert(payload)
    const { error: saveError } = await query
    if (saveError) setError(saveError.code === '23505' ? 'Il codice commessa è già utilizzato.' : 'Non è stato possibile salvare la commessa.')
    else { setModalOpen(false); await load() }
    setSaving(false)
  }

  const remove = async (project: Project) => {
    if (!window.confirm(`Eliminare la commessa ${project.code}? I movimenti collegati resteranno archiviati senza commessa.`)) return
    const { error: deleteError } = await supabase.from('projects').update({deleted_at:new Date().toISOString()}).eq('id', project.id)
    if (deleteError) setError('Non è stato possibile eliminare la commessa.')
    else await load()
  }

  return <div>
    <div className="management-page-heading"><div><span>Centro operativo</span><h1>Cantieri e commesse</h1><p>Ricavi, costi, documenti e materiali riuniti per ogni cantiere.</p></div><button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="plus" /> Nuova commessa</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card"><div className="management-table-wrap"><table className="management-table management-table--projects"><thead><tr><th>Commessa</th><th>Cliente</th><th>Stato</th><th>Periodo</th><th className="is-number">Ricavi</th><th className="is-number">Costi</th><th className="is-number">Margine</th><th aria-label="Azioni" /></tr></thead><tbody>{projects.map((project) => { const value = metrics.get(project.id)!; return <tr key={project.id} className={selectedId === project.id ? 'is-selected' : undefined} onClick={() => setSelectedId(project.id)}><td><strong className="management-table__main">{project.code}</strong><small>{project.name}</small></td><td>{project.clients ? clientDisplayName(project.clients) : '—'}<small>{[project.city, project.province].filter(Boolean).join(' · ')}</small></td><td><span className={`management-badge status-${project.status}`}>{projectStatusLabels[project.status]}</span></td><td>{formatDate(project.start_date)}<small>{project.end_date ? `Fine ${formatDate(project.end_date)}` : 'Fine non definita'}</small></td><td className="is-number">{formatCurrency(value.revenue)}</td><td className="is-number">{formatCurrency(value.costs)}</td><td className={`is-number ${value.margin < 0 ? 'is-negative' : 'is-positive'}`}><strong>{formatCurrency(value.margin)}</strong></td><td><div className="management-row-actions"><button onClick={(event) => { event.stopPropagation(); openEdit(project) }}><ManagementIcon name="edit" /></button><button className="is-danger" onClick={(event) => { event.stopPropagation(); void remove(project) }}><ManagementIcon name="trash" /></button></div></td></tr> })}</tbody></table></div>{!loading && projects.length === 0 && <div className="management-empty"><p>Nessuna commessa presente.</p><button onClick={openNew}>Crea la prima commessa</button></div>}</section>

    {selected && <ProjectDetail project={selected} documents={documents.filter((item) => item.project_id === selected.id)} purchases={purchases.filter((item) => item.project_id === selected.id)} expenses={expenses.filter((item) => item.project_id === selected.id)} metrics={metrics.get(selected.id)!} />}
    {selected && <ProjectForecast key={selected.id} project={selected} onSaved={load} />}

    {modalOpen && <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" onClick={() => setModalOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Commessa</span><h2>{editingId ? 'Modifica commessa' : 'Nuova commessa'}</h2></div><button type="button" onClick={() => setModalOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void save(event)}><label><span>Codice *</span><input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} /></label><label><span>Cliente *</span><select required value={form.client_id} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value }))}><option value="">Seleziona cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label><label className="is-wide"><span>Nome commessa *</span><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label className="is-wide"><span>Indirizzo cantiere</span><input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label><label><span>Comune</span><input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} /></label><label><span>Provincia</span><input maxLength={2} value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value.toUpperCase() }))} /></label><label><span>Data inizio</span><input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} /></label><label><span>Data fine</span><input type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} /></label><label><span>Stato</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}>{Object.entries(projectStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><div /><label><span>Costo manodopera</span><input type="number" min="0" step="0.01" value={form.labor_cost} onChange={(event) => setForm((current) => ({ ...current, labor_cost: Number(event.target.value) }))} /></label><label><span>Costo trasferte</span><input type="number" min="0" step="0.01" value={form.travel_cost} onChange={(event) => setForm((current) => ({ ...current, travel_cost: Number(event.target.value) }))} /></label><label><span>Altri costi diretti</span><input type="number" min="0" step="0.01" value={form.other_cost} onChange={(event) => setForm((current) => ({ ...current, other_cost: Number(event.target.value) }))} /></label><label className="is-wide"><span>Note</span><textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label><div className="management-form__actions is-wide"><button type="button" className="management-secondary-button" onClick={() => setModalOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva commessa'}</button></div></form></div></div>}
  </div>
}

function ProjectDetail({ project, documents, purchases, expenses, metrics }: { project: Project; documents: BusinessDocument[]; purchases: PurchaseDocument[]; expenses: Expense[]; metrics: { revenue: number; costs: number; margin: number;plannedRevenue:number;estimatedCosts:number;estimatedMargin:number } }) {
  return <section className="management-card management-project-detail"><div className="management-card__header"><div><h2>{project.code} · {project.name}</h2><p>{[project.address, project.city, project.province].filter(Boolean).join(', ') || 'Indirizzo non indicato'}</p></div><Link to={`/gestionale/documenti/nuovo?tipo=quote&cliente=${project.client_id}&commessa=${project.id}`}>Nuovo preventivo</Link></div><div className="management-project-kpis"><article><span>Fatturato</span><strong>{formatCurrency(metrics.revenue)}</strong></article><article><span>Costi complessivi</span><strong>{formatCurrency(metrics.costs)}</strong></article><article><span>Margine</span><strong className={metrics.margin < 0 ? 'is-negative' : 'is-positive'}>{formatCurrency(metrics.margin)}</strong></article><article><span>Margine %</span><strong>{metrics.revenue ? `${(metrics.margin / metrics.revenue * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%` : '—'}</strong></article></div><div className="management-project-columns"><div><h3>Documenti di vendita</h3>{documents.length ? documents.map((document) => <Link key={document.id} to={`/gestionale/documenti/${document.id}`}>{document.number}<strong>{formatCurrency(document.total)}</strong></Link>) : <p>Nessun documento.</p>}</div><div><h3>Fatture passive</h3>{purchases.length ? purchases.map((item) => <span key={item.id}>{item.number}<strong>{formatCurrency(item.total)}</strong></span>) : <p>Nessuna fattura passiva.</p>}</div><div><h3>Spese</h3>{expenses.length ? expenses.map((item) => <span key={item.id}>{item.description}<strong>{formatCurrency(item.amount)}</strong></span>) : <p>Nessuna spesa.</p>}</div></div></section>
}

function ProjectForecast({project,onSaved}:{project:Project;onSaved:()=>Promise<void>}){const [form,setForm]=useState({area_sqm:Number(project.area_sqm||0),planned_revenue:Number(project.planned_revenue||0),estimated_material_cost:Number(project.estimated_material_cost||0),estimated_labor_cost:Number(project.estimated_labor_cost||0),estimated_travel_cost:Number(project.estimated_travel_cost||0),estimated_other_cost:Number(project.estimated_other_cost||0)});const [saving,setSaving]=useState(false);const estimated=form.estimated_material_cost+form.estimated_labor_cost+form.estimated_travel_cost+form.estimated_other_cost;const save=async(e:FormEvent)=>{e.preventDefault();setSaving(true);await supabase.from('projects').update(form).eq('id',project.id);await onSaved();setSaving(false)};return <section className="management-card management-project-forecast"><div className="management-card__header"><div><h2>Preventivo economico</h2><p>Confronta il margine previsto con il risultato consuntivo della commessa.</p></div></div><form className="management-form management-form--grid" onSubmit={e=>void save(e)}><ForecastField label="Superficie prevista mq" value={form.area_sqm} set={value=>setForm(c=>({...c,area_sqm:value}))}/><ForecastField label="Ricavo previsto" value={form.planned_revenue} set={value=>setForm(c=>({...c,planned_revenue:value}))}/><ForecastField label="Materiali stimati" value={form.estimated_material_cost} set={value=>setForm(c=>({...c,estimated_material_cost:value}))}/><ForecastField label="Manodopera stimata" value={form.estimated_labor_cost} set={value=>setForm(c=>({...c,estimated_labor_cost:value}))}/><ForecastField label="Trasferte stimate" value={form.estimated_travel_cost} set={value=>setForm(c=>({...c,estimated_travel_cost:value}))}/><ForecastField label="Altri costi stimati" value={form.estimated_other_cost} set={value=>setForm(c=>({...c,estimated_other_cost:value}))}/><div className="management-forecast-result is-wide"><span>Costi previsti <strong>{formatCurrency(estimated)}</strong></span><span>Margine previsto <strong className={form.planned_revenue-estimated<0?'is-negative':'is-positive'}>{formatCurrency(form.planned_revenue-estimated)}</strong></span><button className="management-primary-button" disabled={saving}>{saving?'Salvataggio…':'Salva previsione'}</button></div></form></section>}
function ForecastField({label,value,set}:{label:string;value:number;set:(value:number)=>void}){return <label><span>{label}</span><input type="number" min="0" step="0.01" value={value} onChange={e=>set(Number(e.target.value))}/></label>}

function normalizeDocument(document: BusinessDocument) { return { ...document, total: Number(document.total), subtotal: Number(document.subtotal), tax_amount: Number(document.tax_amount), other_amount: Number(document.other_amount) } }
