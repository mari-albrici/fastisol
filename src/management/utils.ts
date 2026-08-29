export const formatCurrency = (value: number) => new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
}).format(value)

export const formatDate = (value: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('it-IT').format(new Date(`${value}T12:00:00`))
}

export const todayIso = () => new Date().toISOString().slice(0, 10)

export function clientDisplayName(client: { company_name: string; contact_name: string }) {
  return client.company_name || client.contact_name || 'Cliente senza nome'
}

export function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('duplicate key')) return 'Esiste già un elemento con questi dati.'
  }
  return fallback
}

