export const analyticsConfig = {
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || null,
  gtmContainerId: import.meta.env.VITE_GTM_CONTAINER_ID?.trim() || null,
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID?.trim() || null,
} as const

export interface ConsentPreferences {
  analytics: boolean
  marketing: boolean
}

export type AnalyticsEventParameters = Record<string, string | number | boolean | undefined>

const CONSENT_STORAGE_KEY = 'fastisol-consent-v2'
const LEGACY_CONSENT_STORAGE_KEY = 'fastisol-consent-v1'
const CONSENT_STORAGE_VERSION = 2
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000
const CONSENT_EVENT_NAME = 'fastisol:consent-change'
const OPEN_SETTINGS_EVENT_NAME = 'fastisol:open-cookie-settings'

let activeConsent: ConsentPreferences = { analytics: false, marketing: false }

declare global {
  interface Window {
    dataLayer?: unknown[]
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string }
    _fbq?: Window['fbq']
  }
}

function appendScript(id: string, src: string) {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function ensureGoogleQueue() {
  window.dataLayer = window.dataLayer || []
  return window.dataLayer
}

function googleCommand(...args: unknown[]) {
  ensureGoogleQueue().push(args)
}

function updateGoogleConsent(preferences: ConsentPreferences) {
  googleCommand('consent', 'update', {
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
  })
}

function initializeGoogleTracking(preferences: ConsentPreferences) {
  if (!preferences.analytics && !preferences.marketing) return

  if (analyticsConfig.gtmContainerId) {
    ensureGoogleQueue().push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    appendScript(
      'fastisol-google-tag-manager',
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(analyticsConfig.gtmContainerId)}`,
    )
    return
  }

  if (preferences.analytics && analyticsConfig.gaMeasurementId) {
    appendScript(
      'fastisol-google-analytics',
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsConfig.gaMeasurementId)}`,
    )
    googleCommand('js', new Date())
    googleCommand('config', analyticsConfig.gaMeasurementId, { send_page_view: false })
  }
}

function initializeMetaPixel() {
  if (!analyticsConfig.metaPixelId || window.fbq) return

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue?.push(args)
  } as NonNullable<Window['fbq']>

  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  window.fbq = fbq
  window._fbq = fbq
  appendScript('fastisol-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js')
  fbq('init', analyticsConfig.metaPixelId)
}

export function isAnalyticsConfigured() {
  return Object.values(analyticsConfig).some(Boolean)
}

export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null

  try {
    window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY)
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as Partial<ConsentPreferences> & { version?: number; updatedAt?: number }
    const analytics = parsed.analytics
    const marketing = parsed.marketing
    const isValid = parsed.version === CONSENT_STORAGE_VERSION
      && typeof parsed.updatedAt === 'number'
      && Date.now() - parsed.updatedAt <= CONSENT_MAX_AGE_MS
      && typeof analytics === 'boolean'
      && typeof marketing === 'boolean'

    if (!isValid) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY)
      return null
    }
    return { analytics, marketing }
  } catch {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
    return null
  }
}

export function initializeConsentDefaults() {
  if (typeof window === 'undefined') return
  googleCommand('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  })
}

export function applyConsent(preferences: ConsentPreferences, persist = true) {
  if (typeof window === 'undefined') return
  const previousConsent = activeConsent
  activeConsent = preferences

  if (persist) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      version: CONSENT_STORAGE_VERSION,
      updatedAt: Date.now(),
      ...preferences,
    }))
  }

  updateGoogleConsent(preferences)
  initializeGoogleTracking(preferences)

  if (preferences.marketing) {
    initializeMetaPixel()
    window.fbq?.('consent', 'grant')
  } else {
    window.fbq?.('consent', 'revoke')
  }

  if (previousConsent.analytics && !preferences.analytics) {
    deleteFirstPartyCookies(['_ga', '_ga_'])
  }
  if (previousConsent.marketing && !preferences.marketing) {
    deleteFirstPartyCookies(['_fbp', '_gcl_', '_gac_'])
  }

  window.dispatchEvent(new CustomEvent<ConsentPreferences>(CONSENT_EVENT_NAME, { detail: preferences }))
}

function deleteFirstPartyCookies(prefixes: string[]) {
  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name) && prefixes.some((prefix) => name.startsWith(prefix)))

  const hostParts = window.location.hostname.split('.')
  const parentDomain = hostParts.length > 1 ? `.${hostParts.slice(-2).join('.')}` : null

  cookieNames.forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    if (parentDomain) document.cookie = `${name}=; Max-Age=0; path=/; domain=${parentDomain}; SameSite=Lax`
  })
}

export function trackPageView(path: string, title: string) {
  if (typeof window === 'undefined') return

  const parameters = {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  }

  if (analyticsConfig.gtmContainerId && (activeConsent.analytics || activeConsent.marketing)) {
    ensureGoogleQueue().push({ event: 'virtual_page_view', ...parameters })
  } else if (analyticsConfig.gaMeasurementId && activeConsent.analytics) {
    googleCommand('event', 'page_view', parameters)
  }

  if (analyticsConfig.metaPixelId && activeConsent.marketing) {
    window.fbq?.('track', 'PageView')
  }
}

export function trackEvent(name: string, parameters: AnalyticsEventParameters = {}) {
  if (typeof window === 'undefined') return

  if (analyticsConfig.gtmContainerId && (activeConsent.analytics || activeConsent.marketing)) {
    ensureGoogleQueue().push({ event: name, ...parameters })
  } else if (analyticsConfig.gaMeasurementId && activeConsent.analytics) {
    googleCommand('event', name, parameters)
  }

  if (analyticsConfig.metaPixelId && activeConsent.marketing) {
    if (name === 'generate_lead') window.fbq?.('track', 'Lead')
    if (name === 'click_phone' || name === 'click_whatsapp' || name === 'click_email') {
      window.fbq?.('trackCustom', 'ContactChannelClick', { channel: name.replace('click_', '') })
    }
  }
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT_NAME))
}

export const analyticsEvents = {
  consentChange: CONSENT_EVENT_NAME,
  openSettings: OPEN_SETTINGS_EVENT_NAME,
} as const
