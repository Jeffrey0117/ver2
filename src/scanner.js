const REFERENCE_PATTERN = /\b(src|href)\s*=\s*(["'])((?:(?!\2).)*)\2/gi

const SKIP_PREFIXES = ['http://', 'https://', '//', 'data:', 'mailto:', 'tel:', 'javascript:', '#']

export function scanReferences(htmlContent, staticExtensions) {
  const references = []
  let match

  while ((match = REFERENCE_PATTERN.exec(htmlContent)) !== null) {
    const [fullMatch, attribute, quote, url] = match
    const trimmedUrl = url.trim()

    if (shouldSkip(trimmedUrl, staticExtensions)) continue

    const { urlWithoutQuery, existingParam, otherParams } = parseUrl(trimmedUrl)

    references.push({
      fullMatch,
      attribute,
      quote,
      url: trimmedUrl,
      urlWithoutQuery,
      existingParam,
      otherParams,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    })
  }

  return references
}

function shouldSkip(url, staticExtensions) {
  if (!url) return true
  for (const prefix of SKIP_PREFIXES) {
    if (url.startsWith(prefix)) return true
  }
  const { urlWithoutQuery } = parseUrl(url)
  const ext = getExtension(urlWithoutQuery)
  if (!ext) return true
  if (!staticExtensions.includes(ext)) return true
  return false
}

function parseUrl(url) {
  const [pathAndHash] = url.split('#')
  const [urlWithoutQuery, ...queryParts] = pathAndHash.split('?')
  const queryString = queryParts.join('?')

  let existingParam = null
  let otherParams = ''

  if (queryString) {
    const params = queryString.split('&')
    const vParam = params.find(p => p.startsWith('v='))
    const others = params.filter(p => !p.startsWith('v='))

    if (vParam) {
      existingParam = vParam.split('=')[1]
    }
    otherParams = others.join('&')
  }

  return { urlWithoutQuery, existingParam, otherParams }
}

function getExtension(url) {
  const lastDot = url.lastIndexOf('.')
  const lastSlash = url.lastIndexOf('/')
  if (lastDot <= lastSlash) return null
  return url.slice(lastDot).toLowerCase()
}
