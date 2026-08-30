export type DocumentType = 'quote' | 'proforma' | 'invoice'
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'cancelled'
export type ResourceCategory = 'technical_sheet' | 'certification'
export type ReminderType = 'follow_up' | 'payment' | 'certification' | 'other'
export type InteractionType = 'note' | 'call'

export interface Client {
  id: string
  company_name: string
  contact_name: string
  tax_code: string
  vat_number: string
  email: string
  phone: string
  address: string
  postal_code: string
  city: string
  province: string
  country: string
  sdi_code: string
  pec: string
  notes: string
  created_at: string
  updated_at: string
}

export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>

export interface Supplier {
  id: string
  company_name: string
  contact_name: string
  tax_code: string
  vat_number: string
  fiscal_regime: string
  email: string
  phone: string
  pec: string
  sdi_code: string
  address: string
  postal_code: string
  city: string
  province: string
  country: string
  iban: string
  notes: string
  created_at: string
  updated_at: string
}

export type SupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>

export interface DocumentItem {
  id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  position: number
  tax_rate?: number | null
  nature_code?: string
  discount_percent?: number
}

export interface BusinessDocument {
  id: string
  client_id: string
  job_id: string | null
  type: DocumentType
  number: string
  issue_date: string
  expiry_date: string | null
  status: DocumentStatus
  subject: string
  notes: string
  payment_terms: string
  subtotal: number
  discount_percent: number
  tax_rate: number
  tax_amount: number
  other_amount: number
  total: number
  approved: boolean
  work_completed: boolean
  project_id?: string | null
  electronic_document_type?: string
  stamp_duty?: boolean
  stamp_amount?: number
  withholding_type?: string
  withholding_rate?: number
  withholding_amount?: number
  withholding_reason?: string
  pension_fund_type?: string
  pension_rate?: number
  pension_amount?: number
  pension_tax_rate?: number
  pension_withheld?: boolean
  split_payment?: boolean
  order_reference?: string
  order_date?: string | null
  contract_reference?: string
  contract_date?: string | null
  ddt_reference?: string
  ddt_date?: string | null
  sdi_id?: string
  electronic_status?: ElectronicInvoiceStatus
  electronic_sent_at?: string | null
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name'> | null
  document_items?: DocumentItem[]
}

export interface DocumentDraft {
  client_id: string
  job_id: string | null
  type: DocumentType
  number: string
  issue_date: string
  expiry_date: string | null
  status: DocumentStatus
  subject: string
  notes: string
  payment_terms: string
  subtotal: number
  discount_percent: number
  tax_rate: number
  tax_amount: number
  other_amount: number
  total: number
  project_id?: string | null
  electronic_document_type?: string
  stamp_duty?: boolean
  stamp_amount?: number
  withholding_type?: string
  withholding_rate?: number
  withholding_amount?: number
  withholding_reason?: string
  pension_fund_type?: string
  pension_rate?: number
  pension_amount?: number
  pension_tax_rate?: number
  pension_withheld?: boolean
  split_payment?: boolean
  order_reference?: string
  order_date?: string | null
  contract_reference?: string
  contract_date?: string | null
  ddt_reference?: string
  ddt_date?: string | null
}

export interface ResourceFile {
  id: string
  name: string
  category: ResourceCategory
  description: string
  file_name: string
  file_path: string
  file_size: number
  expires_at: string | null
  created_at: string
}

export interface Reminder {
  id: string
  type: ReminderType
  title: string
  notes: string
  due_date: string
  completed: boolean
  client_id: string | null
  document_id: string | null
  created_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name'> | null
  documents?: Pick<BusinessDocument, 'number' | 'type'> | null
}

export interface ClientInteraction {
  id: string
  client_id: string
  type: InteractionType
  content: string
  occurred_at: string
  created_at: string
}

export interface ClientFile {
  id: string
  client_id: string
  name: string
  file_name: string
  file_path: string
  file_size: number
  created_at: string
}

export interface DocumentCommunication {
  id: string
  document_id: string
  channel: 'email' | 'whatsapp'
  recipient: string
  sent_at: string
}

export interface FiscalExportHistory {
  id: string
  source_document_id: string
  fiscal_number: string
  issue_date: string
  document_type: string
  source_reference: string
  transmission_progressive: string
  xml_file_name: string
  xml_sha256: string
  xml_snapshot: string
  xsd_version: string
  created_at: string
}

export interface DocumentNumberSetting {
  id?: string
  year: number
  type: DocumentType
  prefix: string
  next_number: number
  padding: number
}

export interface Warranty {
  id: string
  client_id: string
  number: string
  issue_date: string
  expiry_date: string | null
  material_name: string
  lot_number: string
  site_address: string
  coverage_text: string
  notes: string
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name' | 'address' | 'postal_code' | 'city' | 'province'> | null
}

export interface InventoryLot {
  id: string
  lot_number: string
  material_name: string
  supplier: string
  supplier_id: string | null
  purchase_date: string
  drum_count: number
  drum_weight_kg: number
  unit_cost?: number
  notes: string
  created_at: string
  inventory_usages?: InventoryUsage[]
  suppliers?: Pick<Supplier, 'company_name' | 'contact_name'> | null
}

export interface InventoryUsage {
  id: string
  lot_id: string
  client_id: string | null
  project_id?: string | null
  barrel_number: number
  site_name: string
  site_address: string
  used_weight_kg: number
  used_at: string
  notes: string
  created_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name'> | null
  projects?: Pick<Project, 'code' | 'name'> | null
}

export interface InvoiceSettings {
  id?: string
  denomination: string
  tax_code: string
  vat_number: string
  fiscal_regime: string
  address: string
  postal_code: string
  city: string
  province: string
  country: string
  iban: string
  transmission_sequence: number
}

export type ProjectStatus = 'planned' | 'active' | 'completed' | 'cancelled'

export interface Project {
  id: string
  client_id: string
  code: string
  name: string
  address: string
  city: string
  province: string
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  labor_cost: number
  travel_cost: number
  other_cost: number
  planned_revenue?: number
  estimated_material_cost?: number
  estimated_labor_cost?: number
  estimated_travel_cost?: number
  estimated_other_cost?: number
  area_sqm?: number
  notes: string
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name'> | null
}

export interface PurchaseDocument {
  id: string
  supplier_id: string
  project_id: string | null
  kind: 'invoice' | 'credit_note' | 'receipt' | 'other'
  number: string
  issue_date: string
  due_date: string | null
  taxable_amount: number
  tax_amount: number
  total: number
  paid_amount: number
  payment_date: string | null
  notes: string
  file_name: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  suppliers?: Pick<Supplier, 'company_name' | 'contact_name'> | null
  projects?: Pick<Project, 'code' | 'name'> | null
}

export interface Expense {
  id: string
  project_id: string | null
  supplier_id: string | null
  category: 'material' | 'labor' | 'travel' | 'equipment' | 'service' | 'tax' | 'other'
  expense_date: string
  description: string
  amount: number
  payment_method: string
  notes: string
  file_name: string | null
  file_path: string | null
  projects?: Pick<Project, 'code' | 'name'> | null
  suppliers?: Pick<Supplier, 'company_name' | 'contact_name'> | null
}

export interface SalesPayment {
  id: string
  document_id: string
  project_id: string | null
  kind: 'deposit' | 'partial' | 'balance'
  due_date: string
  amount: number
  paid_date: string | null
  payment_method: string
  notes: string
  documents?: Pick<BusinessDocument, 'number' | 'type' | 'total' | 'client_id'> & { clients?: Pick<Client, 'company_name' | 'contact_name'> | null }
}

export interface PurchaseOrderItem { id?: string; description: string; quantity: number; unit: string; unit_price: number; position: number }
export interface PurchaseOrder {
  id: string; supplier_id: string; project_id: string | null; number: string; order_date: string; expected_date: string | null;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'; notes: string; total: number;
  suppliers?: Pick<Supplier, 'company_name' | 'contact_name'> | null; projects?: Pick<Project, 'code' | 'name'> | null; purchase_order_items?: PurchaseOrderItem[]
}

export interface DeliveryNoteItem { id?: string; material_name: string; lot_number: string; drum_count: number; drum_weight_kg: number; inventory_lot_id?: string | null; position: number }
export interface DeliveryNote {
  id: string; supplier_id: string; purchase_order_id: string | null; project_id: string | null; number: string; delivery_date: string; notes: string;
  suppliers?: Pick<Supplier, 'company_name' | 'contact_name'> | null; projects?: Pick<Project, 'code' | 'name'> | null; delivery_note_items?: DeliveryNoteItem[]
}

export const projectStatusLabels: Record<ProjectStatus, string> = { planned: 'Pianificata', active: 'In corso', completed: 'Conclusa', cancelled: 'Annullata' }

export interface AuditLog { id: number; table_name: string; record_id: string | null; action: 'INSERT'|'UPDATE'|'DELETE'; old_data: Record<string,unknown>|null; new_data: Record<string,unknown>|null; created_at: string }
export interface CatalogItem { id: string; code: string; description: string; category: string; unit: string; sale_price: number; estimated_cost: number; tax_rate: number; nature_code: string; active: boolean; notes: string; deleted_at: string|null }
export interface Team { id: string; name: string; members: string; phone: string; notes: string; active: boolean; deleted_at: string|null }
export type CalendarEventType = 'inspection'|'job'|'delivery'|'follow_up'|'other'
export interface CalendarEvent { id: string; project_id: string|null; client_id: string|null; team_id: string|null; type: CalendarEventType; title: string; starts_at: string; ends_at: string; address: string; notes: string; completed: boolean; created_at?: string; updated_at?: string; deleted_at: string|null; google_event_id?: string|null; google_calendar_id?: string|null; google_updated_at?: string|null; google_synced_at?: string|null; google_html_link?: string|null; projects?: Pick<Project,'code'|'name'>|null; clients?: Pick<Client,'company_name'|'contact_name'>|null; teams?: Pick<Team,'name'>|null }
export interface DiaryEntry { id: string; project_id: string; work_date: string; team_id: string|null; start_time: string|null; end_time: string|null; workers: number; area_completed_sqm: number; temperature_c: number|null; conditions: string; work_done: string; issues: string; client_signature: string; deleted_at: string|null; teams?: Pick<Team,'name'>|null; project_diary_files?: DiaryFile[] }
export interface DiaryFile { id: string; entry_id: string; file_name: string; file_path: string; file_type: string; file_size: number; created_at: string }
export type ElectronicInvoiceStatus = 'not_sent'|'exported'|'sent'|'delivered'|'not_delivered'|'rejected'|'corrected'|'cancelled'
export interface ElectronicInvoiceEvent { id: string; document_id: string; status: Exclude<ElectronicInvoiceStatus,'not_sent'>; sdi_id: string; event_at: string; reason: string; file_name: string|null; file_path: string|null; file_type: string|null; file_size: number|null; documents?: Pick<BusinessDocument,'number'|'issue_date'|'total'> & { clients?: Pick<Client,'company_name'|'contact_name'>|null } }
export interface InventoryMaterialSetting { id: string; material_name: string; supplier_id: string|null; min_drums: number; reorder_drums: number; active: boolean; suppliers?: Pick<Supplier,'company_name'|'contact_name'>|null }
export interface BackupSnapshot { id: string; label: string; payload: Record<string,unknown>; created_at: string }

export const resourceCategoryLabels: Record<ResourceCategory, string> = {
  technical_sheet: 'Scheda tecnica',
  certification: 'Certificazione',
}

export const reminderTypeLabels: Record<ReminderType, string> = {
  follow_up: 'Richiamo preventivo',
  payment: 'Pagamento',
  certification: 'Certificazione',
  other: 'Altro',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  quote: 'Preventivo',
  proforma: 'Fattura proforma',
  invoice: 'Fattura',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  accepted: 'Accettato',
  paid: 'Pagato',
  cancelled: 'Annullato',
}
