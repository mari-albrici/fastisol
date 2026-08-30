import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const distDirectory = resolve(import.meta.dirname, '..', 'dist')
const port = Number(process.env.FASTISOL_PREVIEW_PORT || 4174)

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
}

function safePath(relativePath) {
  const absolutePath = resolve(distDirectory, relativePath)
  if (absolutePath !== distDirectory && !absolutePath.startsWith(`${distDirectory}${sep}`)) return null
  return absolutePath
}

async function fileExists(pathname) {
  try {
    return (await stat(pathname)).isFile()
  } catch {
    return false
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`)
  const pathname = decodeURIComponent(requestUrl.pathname).replace(/\/+$/, '') || '/'
  let relativePath = pathname === '/' ? 'index.html' : pathname.slice(1)
  let statusCode = 200

  if (pathname === '/gestionale' || pathname.startsWith('/gestionale/')) {
    relativePath = 'gestionale-shell.html'
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  } else {
    const directPath = safePath(relativePath)
    const htmlPath = safePath(`${relativePath}.html`)
    if (!directPath || !(await fileExists(directPath))) {
      if (htmlPath && await fileExists(htmlPath)) relativePath = `${relativePath}.html`
      else {
        relativePath = '404.html'
        statusCode = 404
      }
    }
  }

  const absolutePath = safePath(relativePath)
  if (!absolutePath) {
    response.writeHead(400)
    response.end('Bad request')
    return
  }

  try {
    const body = await readFile(absolutePath)
    response.writeHead(statusCode, {
      'Content-Type': mimeTypes[extname(absolutePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    response.end(body)
  } catch {
    response.writeHead(500)
    response.end('Preview error')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Fastisol dist preview: http://127.0.0.1:${port}`)
})
