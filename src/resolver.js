import { resolve, dirname, normalize } from 'node:path'

export function resolveFilePath(url, htmlFilePath, rootDir, prefixMap = {}) {
  const cleanUrl = url.split('?')[0].split('#')[0]

  for (const [prefix, mappedDir] of Object.entries(prefixMap)) {
    if (cleanUrl.startsWith(prefix)) {
      const remainder = cleanUrl.slice(prefix.length)
      return normalize(resolve(rootDir, mappedDir, remainder))
    }
  }

  if (cleanUrl.startsWith('/')) {
    return normalize(resolve(rootDir, cleanUrl.slice(1)))
  }

  return normalize(resolve(dirname(htmlFilePath), cleanUrl))
}
