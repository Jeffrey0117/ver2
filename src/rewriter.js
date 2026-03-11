export function rewriteReferences(htmlContent, updates) {
  const sorted = [...updates].sort((a, b) => b.reference.startIndex - a.reference.startIndex)

  let result = htmlContent

  for (const { reference, hash } of sorted) {
    const newUrl = buildNewUrl(reference, hash)
    const newAttr = `${reference.attribute}=${reference.quote}${newUrl}${reference.quote}`
    result = result.slice(0, reference.startIndex) + newAttr + result.slice(reference.endIndex)
  }

  return result
}

function buildNewUrl(reference, hash) {
  const { urlWithoutQuery, otherParams } = reference
  const paramName = 'v'

  if (otherParams) {
    return `${urlWithoutQuery}?${paramName}=${hash}&${otherParams}`
  }
  return `${urlWithoutQuery}?v=${hash}`
}
