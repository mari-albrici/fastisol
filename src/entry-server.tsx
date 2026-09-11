import { StrictMode } from 'react'
import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import {
  consolidatedPublicRoutes,
  indexablePublicRoutes,
  legalPublicRoutes,
  maintenancePublicRoutes,
  prerenderPublicRoutes,
} from './data/publicRoutes'
import { setServerSeoCollector, type SeoSnapshot } from './utils/seoCollector'

export { consolidatedPublicRoutes, indexablePublicRoutes, legalPublicRoutes, maintenancePublicRoutes, prerenderPublicRoutes }

export interface PrerenderResult {
  appHtml: string
  seo: SeoSnapshot
}

export async function renderPublicRoute(pathname: string): Promise<PrerenderResult> {
  let seo: SeoSnapshot | null = null
  setServerSeoCollector((snapshot) => {
    seo = snapshot
  })

  try {
    const appHtml = await new Promise<string>((resolve, reject) => {
      const output = new PassThrough()
      let renderedHtml = ''
      let renderError: unknown = null

      output.setEncoding('utf8')
      output.on('data', (chunk: string) => { renderedHtml += chunk })
      output.on('end', () => {
        if (renderError) reject(renderError)
        else resolve(renderedHtml)
      })
      output.on('error', reject)

      const { pipe } = renderToPipeableStream(
        <StrictMode>
          <MemoryRouter initialEntries={[pathname]}>
            <App />
          </MemoryRouter>
        </StrictMode>,
        {
          onAllReady() {
            pipe(output)
          },
          onShellError(error) {
            reject(error)
          },
          onError(error) {
            renderError = error
          },
        },
      )
    })

    if (!seo) throw new Error(`Metadati SEO non raccolti per ${pathname}`)
    return { appHtml, seo }
  } finally {
    setServerSeoCollector(null)
  }
}
