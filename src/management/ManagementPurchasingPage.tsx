import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { DeliveryNote, DeliveryNoteItem, Project, PurchaseOrder, PurchaseOrderItem, Supplier } from './types'
import { formatCurrency, formatDate, todayIso } from './utils'

const newOrderItem = (position: number): PurchaseOrderItem => ({ description: '', quantity: 1, unit: 'pz', unit_price: 0, position })
const newDdtItem = (position: number): DeliveryNoteItem => ({ material_name: '', lot_number: '', drum_count: 1, drum_weight_kg: 250, position })

export function ManagementPurchasingPage() {
  const [tab, setTab] = useState<'orders' | 'ddt'>('orders')
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [ddts, setDdts] = useState<DeliveryNote[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [modal, setModal] = useState<'order' | 'ddt' | null>(null)
  const [orderForm, setOrderForm] = useState({ supplier_id: '', project_id: '', number: '', order_date: todayIso(), expected_date: '', status: 'draft', notes: '' })
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([newOrderItem(0)])
  const [ddtForm, setDdtForm] = useState({ supplier_id: '', purchase_order_id: '', project_id: '', number: '', delivery_date: todayIso(), notes: '' })
  const [ddtItems, setDdtItems] = useState<DeliveryNoteItem[]>([newDdtItem(0)])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const [orderResult, ddtResult, supplierResult, projectResult] = await Promise.all([
      supabase.from('purchase_orders').select('*, suppliers(company_name, contact_name), projects(code, name), purchase_order_items(*)').is('deleted_at',null).order('order_date', { ascending: false }),
      supabase.from('delivery_notes').select('*, suppliers(company_name, contact_name), projects(code, name), delivery_note_items(*)').is('deleted_at',null).order('delivery_date', { ascending: false }),
      supabase.from('suppliers').select('*').is('deleted_at',null).order('company_name'), supabase.from('projects').select('*').is('deleted_at',null).order('code'),
    ])
    if (orderResult.error || ddtResult.error) setError('Ordini e DDT richiedono la migrazione 20260830_full_operations.sql.')
    else {
      setOrders((orderResult.data ?? []).map((order) => ({ ...order, total: Number(order.total), purchase_order_items: (order.purchase_order_items ?? []).map((item: PurchaseOrderItem) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price) })) })) as PurchaseOrder[])
      setDdts((ddtResult.data ?? []).map((ddt) => ({ ...ddt, delivery_note_items: (ddt.delivery_note_items ?? []).map((item: DeliveryNoteItem) => ({ ...item, drum_count: Number(item.drum_count), drum_weight_kg: Number(item.drum_weight_kg) })) })) as DeliveryNote[])
    }
    if (!supplierResult.error) setSuppliers((supplierResult.data ?? []) as Supplier[])
    if (!projectResult.error) setProjects((projectResult.data ?? []) as Project[])
    setLoading(false)
  }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const orderTotal = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [orderItems])
  const openOrder = () => { setOrderForm({ supplier_id: '', project_id: '', number: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`, order_date: todayIso(), expected_date: '', status: 'draft', notes: '' }); setOrderItems([newOrderItem(0)]); setModal('order'); setError('') }
  const openDdt = (order?: PurchaseOrder) => { setDdtForm({ supplier_id: order?.supplier_id ?? '', purchase_order_id: order?.id ?? '', project_id: order?.project_id ?? '', number: '', delivery_date: todayIso(), notes: '' }); setDdtItems([newDdtItem(0)]); setModal('ddt'); setError('') }

  const saveOrder = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const cleanItems = orderItems.filter((item) => item.description.trim()).map((item, position) => ({ ...item, position, id: undefined }))
    const { data, error: orderError } = await supabase.from('purchase_orders').insert({ ...orderForm, project_id: orderForm.project_id || null, expected_date: orderForm.expected_date || null, total: orderTotal }).select('id').single()
    if (orderError || !data) setError('Non è stato possibile salvare l’ordine.')
    else {
      const { error: itemError } = await supabase.from('purchase_order_items').insert(cleanItems.map((item) => ({ ...item, order_id: data.id, id: undefined })))
      if (itemError) { await supabase.from('purchase_orders').delete().eq('id', data.id); setError('Non è stato possibile salvare le righe dell’ordine.') }
      else { setModal(null); await load() }
    }
    setSaving(false)
  }

  const saveDdt = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const cleanItems = ddtItems.filter((item) => item.material_name.trim() && item.lot_number.trim())
    const { data, error: ddtError } = await supabase.from('delivery_notes').insert({ ...ddtForm, purchase_order_id: ddtForm.purchase_order_id || null, project_id: ddtForm.project_id || null }).select('id').single()
    if (ddtError || !data) { setError('Non è stato possibile registrare il DDT.'); setSaving(false); return }
    for (const [position, item] of cleanItems.entries()) {
      let lotId: string
      const { data: existing } = await supabase.from('inventory_lots').select('id, drum_count, drum_weight_kg').eq('lot_number', item.lot_number).maybeSingle()
      if (existing) {
        if (Math.abs(Number(existing.drum_weight_kg) - item.drum_weight_kg) > 0.01) { setError(`DDT salvato, ma il lotto ${item.lot_number} esiste con un peso per barile diverso.`); continue }
        lotId = existing.id
        const { error: incrementError } = await supabase.from('inventory_lots').update({ drum_count: Number(existing.drum_count) + item.drum_count }).eq('id', existing.id)
        if (incrementError) { setError(`DDT salvato, ma non è stato possibile aggiornare il lotto ${item.lot_number}.`); continue }
      }
      else {
        const { data: lot, error: lotError } = await supabase.from('inventory_lots').insert({ lot_number: item.lot_number, material_name: item.material_name, supplier_id: ddtForm.supplier_id, purchase_date: ddtForm.delivery_date, drum_count: item.drum_count, drum_weight_kg: item.drum_weight_kg, notes: `Carico automatico da DDT ${ddtForm.number}` }).select('id').single()
        if (lotError) { setError(`DDT salvato, ma il lotto ${item.lot_number} non è stato caricato in magazzino.`); continue }
        lotId = lot.id
      }
      await supabase.from('delivery_note_items').insert({ delivery_note_id: data.id, material_name: item.material_name, lot_number: item.lot_number, drum_count: item.drum_count, drum_weight_kg: item.drum_weight_kg, inventory_lot_id: lotId, position })
    }
    if (ddtForm.purchase_order_id) await supabase.from('purchase_orders').update({ status: 'received' }).eq('id', ddtForm.purchase_order_id)
    setModal(null); await load(); setSaving(false)
  }

  const remove = async (table: 'purchase_orders' | 'delivery_notes', id: string) => { if (!window.confirm('Spostare questa registrazione nel cestino?')) return; await supabase.from(table).update({deleted_at:new Date().toISOString()}).eq('id', id); await load() }
  const updateOrderItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => setOrderItems((items) => items.map((item, current) => current === index ? { ...item, [field]: value } : item))
  const updateDdtItem = (index: number, field: keyof DeliveryNoteItem, value: string | number) => setDdtItems((items) => items.map((item, current) => current === index ? { ...item, [field]: value } : item))

  return <div>
    <div className="management-page-heading"><div><span>Ciclo fornitori</span><h1>Ordini e DDT</h1><p>Dall’ordine al carico automatico dei lotti in magazzino.</p></div><button className="management-primary-button" onClick={tab === 'orders' ? openOrder : () => openDdt()}><ManagementIcon name="plus" /> {tab === 'orders' ? 'Nuovo ordine' : 'Registra DDT'}</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card"><div className="management-tabs management-tabs--card"><button className={tab === 'orders' ? 'is-active' : undefined} onClick={() => setTab('orders')}>Ordini fornitori</button><button className={tab === 'ddt' ? 'is-active' : undefined} onClick={() => setTab('ddt')}>DDT ricevuti</button></div>{loading ? <div className="management-empty">Caricamento…</div> : tab === 'orders' ? <OrderTable items={orders} ddt={openDdt} remove={(id) => remove('purchase_orders', id)} /> : <DdtTable items={ddts} remove={(id) => remove('delivery_notes', id)} />}</section>

    {modal === 'order' && <Modal title="Nuovo ordine fornitore" close={() => setModal(null)}><form className="management-form" onSubmit={(event) => void saveOrder(event)}><div className="management-form management-form--grid"><PartyFields suppliers={suppliers} projects={projects} supplierId={orderForm.supplier_id} projectId={orderForm.project_id} setSupplier={(value) => setOrderForm((c) => ({ ...c, supplier_id: value }))} setProject={(value) => setOrderForm((c) => ({ ...c, project_id: value }))} /><label><span>Numero *</span><input required value={orderForm.number} onChange={(event) => setOrderForm((c) => ({ ...c, number: event.target.value }))} /></label><label><span>Data ordine *</span><input required type="date" value={orderForm.order_date} onChange={(event) => setOrderForm((c) => ({ ...c, order_date: event.target.value }))} /></label><label><span>Consegna prevista</span><input type="date" value={orderForm.expected_date} onChange={(event) => setOrderForm((c) => ({ ...c, expected_date: event.target.value }))} /></label><label><span>Stato</span><select value={orderForm.status} onChange={(event) => setOrderForm((c) => ({ ...c, status: event.target.value }))}><option value="draft">Bozza</option><option value="sent">Inviato</option><option value="partial">Parziale</option><option value="received">Ricevuto</option><option value="cancelled">Annullato</option></select></label></div><ItemEditor items={orderItems} update={updateOrderItem} add={() => setOrderItems((items) => [...items, newOrderItem(items.length)])} remove={(index) => setOrderItems((items) => items.filter((_, i) => i !== index))} /><strong className="management-purchase-total">Totale ordine: {formatCurrency(orderTotal)}</strong><label><span>Note</span><textarea rows={3} value={orderForm.notes} onChange={(event) => setOrderForm((c) => ({ ...c, notes: event.target.value }))} /></label><Actions saving={saving} close={() => setModal(null)} /></form></Modal>}
    {modal === 'ddt' && <Modal title="Registra DDT ricevuto" close={() => setModal(null)}><form className="management-form" onSubmit={(event) => void saveDdt(event)}><div className="management-form management-form--grid"><PartyFields suppliers={suppliers} projects={projects} supplierId={ddtForm.supplier_id} projectId={ddtForm.project_id} setSupplier={(value) => setDdtForm((c) => ({ ...c, supplier_id: value }))} setProject={(value) => setDdtForm((c) => ({ ...c, project_id: value }))} /><label><span>Ordine collegato</span><select value={ddtForm.purchase_order_id} onChange={(event) => { const order = orders.find((item) => item.id === event.target.value); setDdtForm((c) => ({ ...c, purchase_order_id: event.target.value, supplier_id: order?.supplier_id ?? c.supplier_id, project_id: order?.project_id ?? c.project_id })) }}><option value="">Nessuno</option>{orders.filter((item) => item.status !== 'received' && item.status !== 'cancelled').map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select></label><label><span>Numero DDT *</span><input required value={ddtForm.number} onChange={(event) => setDdtForm((c) => ({ ...c, number: event.target.value }))} /></label><label><span>Data consegna *</span><input required type="date" value={ddtForm.delivery_date} onChange={(event) => setDdtForm((c) => ({ ...c, delivery_date: event.target.value }))} /></label></div><DdtItemEditor items={ddtItems} update={updateDdtItem} add={() => setDdtItems((items) => [...items, newDdtItem(items.length)])} remove={(index) => setDdtItems((items) => items.filter((_, i) => i !== index))} /><div className="management-alert management-alert--success">Salvando il DDT, ogni riga creerà automaticamente il relativo lotto in Magazzino.</div><label><span>Note</span><textarea rows={3} value={ddtForm.notes} onChange={(event) => setDdtForm((c) => ({ ...c, notes: event.target.value }))} /></label><Actions saving={saving} close={() => setModal(null)} /></form></Modal>}
  </div>
}

function OrderTable({ items, ddt, remove }: { items: PurchaseOrder[]; ddt: (item: PurchaseOrder) => void; remove: (id: string) => void }) { return items.length ? <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Ordine</th><th>Fornitore</th><th>Commessa</th><th>Consegna</th><th>Stato</th><th className="is-number">Totale</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.number}</strong><small>{formatDate(item.order_date)} · {item.purchase_order_items?.length ?? 0} righe</small></td><td>{item.suppliers ? partyName(item.suppliers) : '—'}</td><td>{item.projects?.code ?? '—'}</td><td>{formatDate(item.expected_date)}</td><td><span className={`management-badge status-${item.status}`}>{item.status}</span></td><td className="is-number">{formatCurrency(item.total)}</td><td><div className="management-row-actions">{item.status !== 'received' && item.status !== 'cancelled' && <button title="Registra DDT" onClick={() => ddt(item)}><ManagementIcon name="warehouse" /></button>}<button className="is-danger" onClick={() => void remove(item.id)}><ManagementIcon name="trash" /></button></div></td></tr>)}</tbody></table></div> : <div className="management-empty">Nessun ordine.</div> }
function DdtTable({ items, remove }: { items: DeliveryNote[]; remove: (id: string) => void }) { return items.length ? <div className="management-table-wrap"><table className="management-table"><thead><tr><th>DDT</th><th>Fornitore</th><th>Commessa</th><th>Data</th><th>Lotti caricati</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.number}</strong></td><td>{item.suppliers ? partyName(item.suppliers) : '—'}</td><td>{item.projects?.code ?? '—'}</td><td>{formatDate(item.delivery_date)}</td><td>{item.delivery_note_items?.map((line) => line.lot_number).join(', ') || '—'}</td><td><div className="management-row-actions"><button className="is-danger" onClick={() => void remove(item.id)}><ManagementIcon name="trash" /></button></div></td></tr>)}</tbody></table></div> : <div className="management-empty">Nessun DDT ricevuto.</div> }
function PartyFields({ suppliers, projects, supplierId, projectId, setSupplier, setProject }: { suppliers: Supplier[]; projects: Project[]; supplierId: string; projectId: string | null; setSupplier: (v:string)=>void; setProject:(v:string)=>void }) { return <><label><span>Fornitore *</span><select required value={supplierId} onChange={(event) => setSupplier(event.target.value)}><option value="">Seleziona</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{partyName(item)}</option>)}</select></label><label><span>Commessa</span><select value={projectId ?? ''} onChange={(event) => setProject(event.target.value)}><option value="">Nessuna</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label></> }
function ItemEditor({ items, update, add, remove }: { items: PurchaseOrderItem[]; update:(i:number,f:keyof PurchaseOrderItem,v:string|number)=>void; add:()=>void; remove:(i:number)=>void }) { return <div className="management-line-editor"><div className="document-form-section__heading"><h3>Righe ordine</h3><button type="button" onClick={add}><ManagementIcon name="plus" /> Aggiungi</button></div>{items.map((item,index) => <div className="management-line-row" key={index}><input required placeholder="Descrizione" value={item.description} onChange={(e)=>update(index,'description',e.target.value)} /><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e)=>update(index,'quantity',Number(e.target.value))} /><input value={item.unit} onChange={(e)=>update(index,'unit',e.target.value)} /><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e)=>update(index,'unit_price',Number(e.target.value))} /><strong>{formatCurrency(item.quantity*item.unit_price)}</strong><button type="button" onClick={()=>remove(index)}><ManagementIcon name="trash" /></button></div>)}</div> }
function DdtItemEditor({ items, update, add, remove }: { items: DeliveryNoteItem[]; update:(i:number,f:keyof DeliveryNoteItem,v:string|number)=>void; add:()=>void; remove:(i:number)=>void }) { return <div className="management-line-editor"><div className="document-form-section__heading"><h3>Materiali e lotti</h3><button type="button" onClick={add}><ManagementIcon name="plus" /> Aggiungi</button></div>{items.map((item,index) => <div className="management-line-row management-line-row--ddt" key={index}><input required placeholder="Materiale" value={item.material_name} onChange={(e)=>update(index,'material_name',e.target.value)} /><input required placeholder="Numero lotto" value={item.lot_number} onChange={(e)=>update(index,'lot_number',e.target.value)} /><input type="number" min="1" value={item.drum_count} onChange={(e)=>update(index,'drum_count',Number(e.target.value))} /><input type="number" min="0.01" step="0.01" value={item.drum_weight_kg} onChange={(e)=>update(index,'drum_weight_kg',Number(e.target.value))} /><button type="button" onClick={()=>remove(index)}><ManagementIcon name="trash" /></button></div>)}</div> }
function Modal({ title, close, children }: { title:string; close:()=>void; children:React.ReactNode }) { return <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" onClick={close} /><div className="management-modal__panel management-modal__panel--wide"><div className="management-modal__header"><div><span>Acquisti</span><h2>{title}</h2></div><button onClick={close}><ManagementIcon name="x" /></button></div>{children}</div></div> }
function Actions({ saving, close }: { saving:boolean; close:()=>void }) { return <div className="management-form__actions"><button type="button" className="management-secondary-button" onClick={close}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving?'Salvataggio…':'Salva'}</button></div> }
function partyName(item: Pick<Supplier,'company_name'|'contact_name'>) { return item.company_name || item.contact_name || 'Fornitore' }
