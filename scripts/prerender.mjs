import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { prerenderPublicRoutes, renderPublicRoute } from '../.prerender-server/entry-server.js'

const projectRoot = resolve(import.meta.dirname, '..')
const distDirectory = resolve(projectRoot, 'dist')
const template = await readFile(resolve(distDirectory, 'index.html'), 'utf8')

const managementShell = template
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Gestionale Fastisol</title>')
  .replace('</head>', '    <meta name="robots" content="noindex, nofollow, noarchive" />\n  </head>')

await writeFile(resolve(distDirectory, 'gestionale-shell.html'), managementShell, 'utf8')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildHead(seo) {
  const robots = seo.noIndex ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large'
  const structuredData = seo.structuredData
    ? `<script id="page-structured-data" type="application/ld+json">${JSON.stringify(seo.structuredData).replaceAll('<', '\\u003c')}</script>`
    : ''

  return [
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="it_IT" />',
    '<meta property="og:site_name" content="Fastisol" />',
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(seo.imageUrl)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    `<meta property="og:image:width" content="${seo.imageWidth}" />`,
    `<meta property="og:image:height" content="${seo.imageHeight}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    structuredData,
  ].filter(Boolean).join('\n    ')
}

function createDocument(result) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(result.seo.title)}</title>`)
    .replace('</head>', `    ${buildHead(result.seo)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${result.appHtml}</div>`)
}

async function writeRoute(pathname, outputPath) {
  const result = await renderPublicRoute(pathname)
  const absoluteOutputPath = resolve(distDirectory, outputPath)
  await mkdir(dirname(absoluteOutputPath), { recursive: true })
  await writeFile(absoluteOutputPath, createDocument(result), 'utf8')
}

for (const pathname of prerenderPublicRoutes) {
  const outputPath = pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`
  await writeRoute(pathname, outputPath)
}

await writeRoute('/pagina-non-trovata', '404.html')

console.log(`Prerender completato: ${prerenderPublicRoutes.length} pagine pubbliche + 404; shell gestionale separata.`)
