export interface ContactFormPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  requestType: string
  location: string
  message: string
  privacyConsent: boolean
  submittedAt: string
}

export const contactFormConfig = {
  endpoint: import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim() || null,
} as const

export async function submitContactForm(payload: ContactFormPayload) {
  if (!contactFormConfig.endpoint) {
    throw new Error('CONTACT_FORM_ENDPOINT_NOT_CONFIGURED')
  }

  const response = await fetch(contactFormConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`CONTACT_FORM_REQUEST_FAILED_${response.status}`)
  }
}
