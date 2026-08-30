import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { Client, InventoryLot, InventoryUsage, Project, Supplier } from './types'
import { clientDisplayName, formatDate, todayIso } from './utils'
import { BarcodeScannerModal } from './BarcodeScannerModal'

const emptyLot = { lot_number: '', material_name: '', supplier: '', supplier_id: '', purchase_date: todayIso(), drum_count: 1, drum_weight_kg: 250, notes: '' }
const emptyUsage = { client_id: '', project_id: '', barrel_number: 1, site_name: '', site_address: '', used_weight_kg: 0, used_at: todayIso(), notes: '' }

export function ManagementInventoryPage() {
  const [lots, setLots] = useState<InventoryLot[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [lotForm, setLotForm] = useState({ ...emptyLot })
  const [usageForm, setUsageForm] = useState({ ...emptyUsage })
  const [lotModal, setLotModal] = useState(false)
  const [usageModal, setUsageModal] = useState(false)
  const [editingLotId, setEditingLotId] = useState<string | null>(null)
  const [scannerTarget, setScannerTarget] = useState<'lookup' | 'new-lot' | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [lotsResult, clientsResult, suppliersResult, projectsResult] = await Promise.all([
      supabase.from('inventory_lots').select('*, suppliers(company_name, contact_name), inventory_usages(*, clients(company_name, contact_name), projects(code, name))').is('deleted_at',null).order('purchase_date', { ascending: false }),
      supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
      supabase.from('suppliers').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
      supabase.from('projects').select('*').is('deleted_at',null).order('code'),
    ])
    if (lotsResult.error) setError('Non è stato possibile caricare il magazzino. Esegui la migrazione di aggiornamento Supabase.')
    else {
      const normalized = (lotsResult.data ?? []).map((lot) => ({ ...lot, drum_count: Number(lot.drum_count), drum_weight_kg: Number(lot.drum_weight_kg), inventory_usages: (lot.inventory_usages ?? []).map((usage: InventoryUsage) => ({ ...usage, used_weight_kg: Number(usage.used_weight_kg) })) })) as InventoryLot[]
      setLots(normalized)
      setSelectedLotId((current) => current && normalized.some((lot) => lot.id === current) ? current : normalized[0]?.id ?? null)
    }
    if (!clientsResult.error) setClients((clientsResult.data ?? []) as Client[])
    if (!suppliersResult.error) setSuppliers((suppliersResult.data ?? []) as Supplier[])
    if (!projectsResult.error) setProjects((projectsResult.data ?? []) as Project[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const selectedLot = lots.find((lot) => lot.id === selectedLotId) ?? null
  const totals = useMemo(() => lots.reduce((acc, lot) => {
    const purchased = lot.drum_count * lot.drum_weight_kg
    const used = (lot.inventory_usages ?? []).reduce((sum, usage) => sum + usage.used_weight_kg, 0)
    return { purchased: acc.purchased + purchased, used: acc.used + used, drums: acc.drums + lot.drum_count }
  }, { purchased: 0, used: 0, drums: 0 }), [lots])

  const openNewLot = () => { setEditingLotId(null); setLotForm({ ...emptyLot, purchase_date: todayIso() }); setError(''); setLotModal(true) }
  const openEditLot = (lot: InventoryLot) => { setEditingLotId(lot.id); setLotForm({ lot_number: lot.lot_number, material_name: lot.material_name, supplier: lot.supplier, supplier_id: lot.supplier_id || '', purchase_date: lot.purchase_date, drum_count: lot.drum_count, drum_weight_kg: lot.drum_weight_kg, notes: lot.notes }); setError(''); setLotModal(true) }
  const openUsage = () => { if (!selectedLot) return; setUsageForm({ ...emptyUsage, used_at: todayIso() }); setError(''); setUsageModal(true) }

  const saveLot = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { ...lotForm, supplier_id: lotForm.supplier_id || null, drum_count: Number(lotForm.drum_count), drum_weight_kg: Number(lotForm.drum_weight_kg) }
    const query = editingLotId ? supabase.from('inventory_lots').update(payload).eq('id', editingLotId) : supabase.from('inventory_lots').insert(payload)
    const { error: saveError } = await query
    if (saveError) setError(saveError.message.includes('unique') ? 'Questo numero di lotto è già presente.' : 'Non è stato possibile salvare il lotto.')
    else { setLotModal(false); await load() }
    setSaving(false)
  }

  const saveUsage = async (event: FormEvent) => {
    event.preventDefault(); if (!selectedLot) return; setSaving(true); setError('')
    const payload = { lot_id: selectedLot.id, client_id: usageForm.client_id || null, project_id: usageForm.project_id || null, barrel_number: Number(usageForm.barrel_number), site_name: usageForm.site_name, site_address: usageForm.site_address, used_weight_kg: Number(usageForm.used_weight_kg), used_at: usageForm.used_at, notes: usageForm.notes }
    const { error: saveError } = await supabase.from('inventory_usages').insert(payload)
    if (saveError) setError(saveError.message.includes('Capacità') ? saveError.message : 'Non è stato possibile registrare il consumo. Controlla che il barile abbia peso residuo sufficiente.')
    else { setUsageModal(false); await load() }
    setSaving(false)
  }

  const removeLot = async (lot: InventoryLot) => {
    if (!window.confirm(`Eliminare il lotto ${lot.lot_number} e tutti i suoi utilizzi?`)) return
    const { error: deleteError } = await supabase.from('inventory_lots').update({deleted_at:new Date().toISOString()}).eq('id', lot.id)
    if (deleteError) setError('Non è stato possibile eliminare il lotto.')
    else await load()
  }

  const removeUsage = async (usage: InventoryUsage) => {
    if (!window.confirm('Eliminare questo utilizzo?')) return
    const { error: deleteError } = await supabase.from('inventory_usages').update({deleted_at:new Date().toISOString()}).eq('id', usage.id)
    if (deleteError) setError('Non è stato possibile eliminare il movimento.')
    else await load()
  }

  const usedByBarrel = (lot: InventoryLot, barrel: number) => (lot.inventory_usages ?? []).filter((usage) => usage.barrel_number === barrel).reduce((sum, usage) => sum + usage.used_weight_kg, 0)

  const handleScannedCode = (rawValue: string) => {
    const value = rawValue.trim()
    const target = scannerTarget
    setScannerTarget(null)
    const parsed = extractInventoryCode(value)
    if (target === 'new-lot') { setLotForm((current) => ({ ...current, lot_number: parsed.lotNumber || value })); return }
    const lot = parsed.lotNumber ? lots.find((item) => item.lot_number.toLocaleLowerCase('it') === parsed.lotNumber.toLocaleLowerCase('it')) : selectedLot
    if (!lot) { openNewLot(); setLotForm({ ...emptyLot, purchase_date: todayIso(), lot_number: parsed.lotNumber || value }); return }
    if (parsed.barrelNumber && parsed.barrelNumber > lot.drum_count) { setError(`Il lotto ${lot.lot_number} contiene soltanto ${lot.drum_count} barili.`); return }
    setSelectedLotId(lot.id)
    setError('')
    if (parsed.barrelNumber) { setUsageForm({ ...emptyUsage, barrel_number: parsed.barrelNumber, used_at: todayIso() }); setUsageModal(true) }
  }

  return <div>
    <div className="management-page-heading"><div><span>Tracciabilità materiale</span><h1>Magazzino</h1><p>Lotti e barili acquistati, peso residuo e consumi suddivisi per cantiere.</p></div><div className="document-editor__top-actions"><button className="management-secondary-button" type="button" onClick={() => setScannerTarget('lookup')}><ManagementIcon name="search" /> Scansiona lotto/barile</button><button className="management-primary-button" type="button" onClick={openNewLot}><ManagementIcon name="plus" /> Nuovo lotto</button></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <div className="management-stats management-stats--inventory"><article><span>Barili acquistati</span><strong>{totals.drums}</strong><ManagementIcon name="warehouse" /></article><article><span>Peso acquistato</span><strong>{formatKg(totals.purchased)}</strong><ManagementIcon name="download" /></article><article><span>Peso utilizzato</span><strong>{formatKg(totals.used)}</strong><ManagementIcon name="upload" /></article><article><span>Disponibile</span><strong>{formatKg(totals.purchased - totals.used)}</strong><ManagementIcon name="dashboard" /></article></div>
    <section className="management-card"><div className="management-card__header"><div><h2>Lotti</h2><p>Seleziona un lotto per vedere barili e cantieri collegati.</p></div></div>{loading ? <div className="management-empty">Caricamento…</div> : lots.length === 0 ? <div className="management-empty"><p>Nessun lotto presente.</p><button type="button" onClick={openNewLot}>Carica il primo lotto</button></div> : <div className="management-table-wrap"><table className="management-table management-table--inventory"><thead><tr><th>Lotto</th><th>Materiale</th><th>Acquisto</th><th>Barili</th><th>Peso acquistato</th><th>Usato</th><th>Residuo</th><th aria-label="Azioni" /></tr></thead><tbody>{lots.map((lot) => { const used = (lot.inventory_usages ?? []).reduce((sum, usage) => sum + usage.used_weight_kg, 0); const purchased = lot.drum_count * lot.drum_weight_kg; return <tr key={lot.id} className={selectedLotId === lot.id ? 'is-selected' : undefined} onClick={() => setSelectedLotId(lot.id)}><td><strong>{lot.lot_number}</strong><small>{lot.suppliers ? supplierDisplayName(lot.suppliers) : lot.supplier || 'Fornitore non indicato'}</small></td><td>{lot.material_name}</td><td>{formatDate(lot.purchase_date)}</td><td>{lot.drum_count}<small>{formatKg(lot.drum_weight_kg)} cad.</small></td><td>{formatKg(purchased)}</td><td>{formatKg(used)}</td><td><strong>{formatKg(purchased - used)}</strong></td><td><div className="management-row-actions"><button type="button" onClick={(event) => { event.stopPropagation(); openEditLot(lot) }}><ManagementIcon name="edit" /></button><button className="is-danger" type="button" onClick={(event) => { event.stopPropagation(); void removeLot(lot) }}><ManagementIcon name="trash" /></button></div></td></tr> })}</tbody></table></div>}</section>

    {selectedLot && <section className="management-card management-inventory-detail"><div className="management-card__header"><div><h2>Utilizzi · Lotto {selectedLot.lot_number}</h2><p>Ogni prelievo indica il barile e il singolo cantiere.</p></div><button className="management-primary-button" type="button" onClick={openUsage}><ManagementIcon name="plus" /> Registra utilizzo</button></div><div className="management-barrels">{Array.from({ length: selectedLot.drum_count }, (_, index) => index + 1).map((barrel) => { const used = usedByBarrel(selectedLot, barrel); return <article key={barrel}><span>Barile {barrel}</span><strong>{formatKg(selectedLot.drum_weight_kg - used)}</strong><small>residui su {formatKg(selectedLot.drum_weight_kg)}</small><div><i style={{ width: `${Math.min(100, used / selectedLot.drum_weight_kg * 100)}%` }} /></div></article> })}</div>{(selectedLot.inventory_usages ?? []).length === 0 ? <div className="management-empty">Nessun utilizzo registrato per questo lotto.</div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Data</th><th>Barile</th><th>Cliente / cantiere</th><th>Località</th><th>Peso usato</th><th>Note</th><th aria-label="Azioni" /></tr></thead><tbody>{[...(selectedLot.inventory_usages ?? [])].sort((a, b) => b.used_at.localeCompare(a.used_at)).map((usage) => <tr key={usage.id}><td>{formatDate(usage.used_at)}</td><td>#{usage.barrel_number}</td><td><strong>{usage.site_name}</strong><small>{usage.clients ? clientDisplayName(usage.clients) : 'Cliente non collegato'}</small></td><td>{usage.site_address || '—'}</td><td><strong>{formatKg(usage.used_weight_kg)}</strong></td><td>{usage.notes || '—'}</td><td><div className="management-row-actions"><button className="is-danger" type="button" onClick={() => void removeUsage(usage)}><ManagementIcon name="trash" /></button></div></td></tr>)}</tbody></table></div>}</section>}

    {lotModal && <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setLotModal(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Magazzino</span><h2>{editingLotId ? 'Modifica lotto' : 'Nuovo lotto'}</h2></div><button type="button" onClick={() => setLotModal(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void saveLot(event)}><label><span>Numero lotto *</span><input required value={lotForm.lot_number} onChange={(event) => setLotForm((current) => ({ ...current, lot_number: event.target.value }))} /></label><label><span>Materiale *</span><input required value={lotForm.material_name} onChange={(event) => setLotForm((current) => ({ ...current, material_name: event.target.value }))} /></label><label><span>Fornitore da anagrafica</span><select value={lotForm.supplier_id} onChange={(event) => setLotForm((current) => ({ ...current, supplier_id: event.target.value }))}><option value="">Nessun fornitore collegato</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplierDisplayName(supplier)}</option>)}</select></label><label><span>Riferimento fornitore libero</span><input value={lotForm.supplier} onChange={(event) => setLotForm((current) => ({ ...current, supplier: event.target.value }))} /></label><label><span>Data acquisto *</span><input required type="date" value={lotForm.purchase_date} onChange={(event) => setLotForm((current) => ({ ...current, purchase_date: event.target.value }))} /></label><label><span>Numero barili *</span><input required type="number" min="1" value={lotForm.drum_count} onChange={(event) => setLotForm((current) => ({ ...current, drum_count: Number(event.target.value) }))} /></label><label><span>Peso per barile (kg) *</span><input required type="number" min="0.01" step="0.01" value={lotForm.drum_weight_kg} onChange={(event) => setLotForm((current) => ({ ...current, drum_weight_kg: Number(event.target.value) }))} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={lotForm.notes} onChange={(event) => setLotForm((current) => ({ ...current, notes: event.target.value }))} /></label><div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setLotModal(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva lotto'}</button></div></form></div></div>}

    {usageModal && selectedLot && <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setUsageModal(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Lotto {selectedLot.lot_number}</span><h2>Registra utilizzo</h2></div><button type="button" onClick={() => setUsageModal(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void saveUsage(event)}><label><span>Barile *</span><select required value={usageForm.barrel_number} onChange={(event) => setUsageForm((current) => ({ ...current, barrel_number: Number(event.target.value) }))}>{Array.from({ length: selectedLot.drum_count }, (_, index) => index + 1).map((barrel) => <option key={barrel} value={barrel}>Barile {barrel} · residui {formatKg(selectedLot.drum_weight_kg - usedByBarrel(selectedLot, barrel))}</option>)}</select></label><label><span>Peso utilizzato (kg) *</span><input required type="number" min="0.01" step="0.01" value={usageForm.used_weight_kg || ''} onChange={(event) => setUsageForm((current) => ({ ...current, used_weight_kg: Number(event.target.value) }))} /></label><label><span>Data utilizzo *</span><input required type="date" value={usageForm.used_at} onChange={(event) => setUsageForm((current) => ({ ...current, used_at: event.target.value }))} /></label><label><span>Commessa</span><select value={usageForm.project_id} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); setUsageForm((current) => ({ ...current, project_id: event.target.value, client_id: project?.client_id ?? current.client_id, site_name: project?.name ?? current.site_name, site_address: project ? [project.address, project.city, project.province].filter(Boolean).join(', ') : current.site_address })) }}><option value="">Nessuna commessa</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}</select></label><label><span>Cliente</span><select value={usageForm.client_id} onChange={(event) => setUsageForm((current) => ({ ...current, client_id: event.target.value }))}><option value="">Nessun cliente collegato</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label><label className="is-wide"><span>Nome cantiere *</span><input required value={usageForm.site_name} onChange={(event) => setUsageForm((current) => ({ ...current, site_name: event.target.value }))} placeholder="Es. Villa Rossi" /></label><label className="is-wide"><span>Indirizzo cantiere</span><input value={usageForm.site_address} onChange={(event) => setUsageForm((current) => ({ ...current, site_address: event.target.value }))} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={usageForm.notes} onChange={(event) => setUsageForm((current) => ({ ...current, notes: event.target.value }))} /></label><div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setUsageModal(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Registrazione…' : 'Registra consumo'}</button></div></form></div></div>}
    {scannerTarget && <BarcodeScannerModal onClose={() => setScannerTarget(null)} onDetected={handleScannedCode} />}
  </div>
}

function extractInventoryCode(value: string) {
  const lotMatch = value.match(/(?:LOTTO|LOT|BATCH)\s*[:=]\s*([^|;,\n]+)/i)
  const barrelMatch = value.match(/(?:BARILE|DRUM|FUSTO)\s*[:=#]\s*(\d+)/i)
  const lotNumber = (lotMatch?.[1] ?? (barrelMatch ? '' : value)).trim()
  return { lotNumber, barrelNumber: barrelMatch ? Number(barrelMatch[1]) : null }
}
function formatKg(value: number) { return `${value.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg` }
function supplierDisplayName(supplier: Pick<Supplier, 'company_name' | 'contact_name'>) { return supplier.company_name.trim() || supplier.contact_name.trim() || 'Fornitore senza nome' }
