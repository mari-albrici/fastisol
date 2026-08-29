export type DocumentType = 'quote' | 'proforma'
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'cancelled'
export type JobStatus = 'planned' | 'completed' | 'cancelled'

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
  notes: string
  created_at: string
  updated_at: string
}

export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>

export interface Job {
  id: string
  client_id: string
  title: string
  description: string
  location: string
  work_date: string | null
  status: JobStatus
  amount: number | null
  notes: string
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'company_name' | 'contact_name'> | null
}

export type JobInput = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'clients'>

export interface DocumentItem {
  id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  position: number
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
  total: number
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
  total: number
}

export const documentTypeLabels: Record<DocumentType, string> = {
  quote: 'Preventivo',
  proforma: 'Fattura proforma',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  accepted: 'Accettato',
  paid: 'Pagato',
  cancelled: 'Annullato',
}

export const jobStatusLabels: Record<JobStatus, string> = {
  planned: 'Pianificato',
  completed: 'Completato',
  cancelled: 'Annullato',
}

