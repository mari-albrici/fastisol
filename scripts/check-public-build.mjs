import { access, readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'
import {
  consolidatedPublicRoutes,
  indexablePublicRoutes,
  legalPublicRoutes,
  maintenancePublicRoutes,
  prerenderPublicRoutes,
} from '../.prerender-server/entry-server.js'

const projectRoot = resolve(import.meta.dirname, '..')
const distDirectory = resolve(projectRoot, 'dist')
const errors = []

function fail(message) {
  errors.push(message)
}

function routeOutputPath(pathname) {
  return resolve(distDirectory, pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`)
}

function countMatches(value, expression) {
  return value.match(expression)?.length ?? 0
}

function getAttributeTag(body, expression) {
  return body.match(expression)?.[1] ?? null
}

function decodeHtml(value) {
  return value.replaceAll('&amp;', '&')
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(entryPath))
    else files.push(entryPath)
  }
  return files
}

const expectedRoutes = [...prerenderPublicRoutes]
if (expectedRoutes.length !== 9) fail(`Attese 9 pagine pubbliche, configurate ${expectedRoutes.length}.`)
if (new Set(expectedRoutes).size !== expectedRoutes.length) fail('La configurazione contiene route pubbliche duplicate.')

const pageBodies = new Map()
for (const pathname of expectedRoutes) {
  const outputPath = routeOutputPath(pathname)
  if (!await fileExists(outputPath)) {
    fail(`${pathname}: file HTML non generato.`)
    continue
  }
  pageBodies.set(pathname, await readFile(outputPath, 'utf8'))
}

const titles = new Map()
const descriptions = new Map()
for (const [pathname, body] of pageBodies) {
  const title = getAttributeTag(body, /<title>([^<]+)<\/title>/)
  const description = getAttributeTag(body, /<meta name="description" content="([^"]+)"/)
  const robots = getAttributeTag(body, /<meta name="robots" content="([^"]+)"/)

  if (countMatches(body, /<title>/g) !== 1 || !title) fail(`${pathname}: title mancante o duplicato.`)
  if (countMatches(body, /<meta name="description"/g) !== 1 || !description) fail(`${pathname}: meta description mancante o duplicata.`)
  if (countMatches(body, /<link rel="canonical"/g) !== 1) fail(`${pathname}: canonical mancante o duplicata.`)
  if (countMatches(body, /<meta name="robots"/g) !== 1 || !robots) fail(`${pathname}: meta robots mancante o duplicato.`)
  if (countMatches(body, /<h1\b/g) !== 1) fail(`${pathname}: deve essere presente esattamente un H1.`)
  if (!maintenancePublicRoutes.includes(pathname) && countMatches(body, /id="page-structured-data"/g) !== 1) fail(`${pathname}: dati strutturati mancanti o duplicati.`)
  if (body.includes('Sezione predisposta')) fail(`${pathname}: rilevato testo da pagina segnaposto.`)

  if (maintenancePublicRoutes.includes(pathname) && !robots.startsWith('noindex, nofollow')) {
    fail(`${pathname}: pagina in manutenzione non protetta da noindex.`)
  }
  if (indexablePublicRoutes.includes(pathname) && !robots.startsWith('index, follow')) {
    fail(`${pathname}: pagina pubblica principale non indicizzabile.`)
  }
  if (legalPublicRoutes.includes(pathname) && !robots.startsWith('noindex, nofollow')) {
    fail(`${pathname}: pagina legale non protetta da noindex.`)
  }

  if (title) titles.set(title, [...(titles.get(title) ?? []), pathname])
  if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), pathname])
}

for (const [title, routes] of titles) {
  if (routes.length > 1) fail(`Title duplicato “${title}” in ${routes.join(', ')}.`)
}
for (const [description, routes] of descriptions) {
  if (routes.length > 1) fail(`Meta description duplicata in ${routes.join(', ')}.`)
}

for (const pathname of consolidatedPublicRoutes) {
  if (await fileExists(routeOutputPath(pathname))) fail(`${pathname}: non deve essere generata come pagina autonoma.`)
}

for (const [sourceRoute, body] of pageBodies) {
  for (const match of body.matchAll(/href="([^"]+)"/g)) {
    const href = decodeHtml(match[1])
    if (href.startsWith('#')) {
      if (href.length > 1 && !body.includes(`id="${decodeURIComponent(href.slice(1))}"`)) {
        fail(`${sourceRoute}: ancora locale inesistente ${href}.`)
      }
      continue
    }
    if (!href.startsWith('/') || href.startsWith('//')) continue

    const targetUrl = new URL(href, 'https://local.fastisol.test')
    const targetRoute = targetUrl.pathname === '/' ? '/' : targetUrl.pathname.replace(/\/$/, '')
    if (consolidatedPublicRoutes.includes(targetRoute)) {
      fail(`${sourceRoute}: collegamento ancora diretto al percorso consolidato ${targetRoute}.`)
      continue
    }

    if (extname(targetRoute)) {
      if (!await fileExists(resolve(distDirectory, targetRoute.slice(1)))) fail(`${sourceRoute}: risorsa collegata assente ${targetRoute}.`)
      continue
    }

    const targetBody = pageBodies.get(targetRoute)
    if (!targetBody) {
      fail(`${sourceRoute}: pagina interna inesistente ${targetRoute}.`)
      continue
    }
    if (targetUrl.hash && !targetBody.includes(`id="${decodeURIComponent(targetUrl.hash.slice(1))}"`)) {
      fail(`${sourceRoute}: ancora inesistente ${targetRoute}${targetUrl.hash}.`)
    }
  }

  for (const match of body.matchAll(/(?:src|href)="(\/(?:assets|fonts|images)\/[^"?#]+)"/g)) {
    const assetPath = resolve(distDirectory, match[1].slice(1))
    if (!await fileExists(assetPath)) fail(`${sourceRoute}: risorsa assente ${match[1]}.`)
  }
}

const notFoundPath = resolve(distDirectory, '404.html')
if (!await fileExists(notFoundPath)) fail('404.html non generato.')
else {
  const notFoundBody = await readFile(notFoundPath, 'utf8')
  if (countMatches(notFoundBody, /<h1\b/g) !== 1) fail('404.html: H1 mancante o duplicato.')
  if (!notFoundBody.includes('noindex, nofollow, noarchive')) fail('404.html: direttiva noindex mancante.')
}

const managementShellPath = resolve(distDirectory, 'gestionale-shell.html')
if (!await fileExists(managementShellPath)) fail('Shell del gestionale non generata.')
else {
  const managementShell = await readFile(managementShellPath, 'utf8')
  if (!managementShell.includes('<div id="root"></div>')) fail('La shell del gestionale contiene HTML prerenderizzato inatteso.')
  if (!managementShell.includes('noindex, nofollow, noarchive')) fail('La shell del gestionale non contiene noindex.')
}

const sitemapPath = resolve(distDirectory, 'sitemap.xml')
if (!await fileExists(sitemapPath)) fail('Sitemap non generata.')
else {
  const sitemap = await readFile(sitemapPath, 'utf8')
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  const expectedUrls = indexablePublicRoutes.map((route) => {
    const canonical = pageBodies.get(route)?.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    return canonical
  }).filter(Boolean)
  if (sitemapUrls.length !== expectedUrls.length) fail(`Sitemap: attesi ${expectedUrls.length} URL, trovati ${sitemapUrls.length}.`)
  for (const expectedUrl of expectedUrls) {
    if (!sitemapUrls.includes(expectedUrl)) fail(`Sitemap: URL mancante ${expectedUrl}.`)
  }
  if (countMatches(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) !== expectedUrls.length) {
    fail('Sitemap: date lastmod mancanti o non valide.')
  }
}

const generatedHtmlFiles = (await walk(distDirectory)).filter((file) => file.endsWith('.html'))
const expectedHtmlCount = expectedRoutes.length + 2
if (generatedHtmlFiles.length !== expectedHtmlCount) {
  fail(`Artefatto: attesi ${expectedHtmlCount} file HTML (9 pagine, 404 e gestionale), trovati ${generatedHtmlFiles.length}.`)
}

const sourceMaps = (await walk(distDirectory)).filter((file) => file.endsWith('.map'))
if (sourceMaps.length) fail(`Source map inattese: ${sourceMaps.map((file) => relative(distDirectory, file).split(sep).join('/')).join(', ')}.`)

if (errors.length) {
  console.error('Controllo pubblico fallito:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Controllo pubblico superato: ${expectedRoutes.length} pagine reali, link e metadati validi, sitemap aggiornata, nessun segnaposto pubblicato.`)
