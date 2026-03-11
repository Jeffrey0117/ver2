import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { mergeConfig } from './config.js'
import { scanReferences } from './scanner.js'
import { hashFile } from './hasher.js'
import { resolveFilePath } from './resolver.js'
import { rewriteReferences } from './rewriter.js'
import { findFiles } from './glob-compat.js'

export function ver2(target, options = {}) {
  const config = mergeConfig(options)
  const rootDir = resolve(target)
  const stat = statSync(rootDir)

  const htmlFiles = stat.isDirectory()
    ? findFiles(rootDir, config.extensions)
    : [resolve(target)]

  const results = htmlFiles.map(htmlPath =>
    processFile(htmlPath, rootDir, config)
  )

  return results
}

export function processFile(htmlPath, rootDir, config) {
  const content = readFileSync(htmlPath, 'utf8')
  const references = scanReferences(content, config.staticExtensions)
  const updates = []
  const warnings = []

  for (const ref of references) {
    let filePath
    try {
      filePath = resolveFilePath(ref.url, htmlPath, rootDir, config.prefixMap)
    } catch {
      warnings.push(`could not resolve path for ${ref.url}`)
      continue
    }

    if (!existsSync(filePath)) {
      warnings.push(`${ref.urlWithoutQuery} -> file not found: ${filePath}`)
      continue
    }

    const hash = hashFile(filePath, config.hashAlgorithm, config.hashLength)
    const changed = ref.existingParam !== hash

    updates.push({ reference: ref, hash, changed })
  }

  const hasChanges = updates.some(u => u.changed)

  if (hasChanges && !config.dryRun) {
    const newContent = rewriteReferences(content, updates.filter(u => u.changed))
    writeFileSync(htmlPath, newContent, 'utf8')
  }

  return {
    path: htmlPath,
    relativePath: relative(rootDir, htmlPath) || htmlPath,
    updates,
    warnings,
  }
}
