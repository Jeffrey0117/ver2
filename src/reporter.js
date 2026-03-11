import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export function formatResults(results, dryRun) {
  const lines = []
  lines.push(`ver2 v${pkg.version}${dryRun ? ' (dry run)' : ''}`)
  lines.push('')

  let totalFiles = 0
  let totalUpdated = 0
  let totalUnchanged = 0
  let totalWarnings = 0

  for (const file of results) {
    totalFiles++
    if (file.updates.length === 0 && file.warnings.length === 0) continue

    lines.push(file.relativePath)

    for (const update of file.updates) {
      const ref = update.reference
      const old = ref.existingParam ? `?v=${ref.existingParam}` : '(none)'
      const arrow = update.changed ? '->' : '=='
      const tag = update.changed ? '' : ' (unchanged)'
      lines.push(`  ${ref.urlWithoutQuery}  ${old} ${arrow} ?v=${update.hash}${tag}`)

      if (update.changed) totalUpdated++
      else totalUnchanged++
    }

    for (const warning of file.warnings) {
      lines.push(`  WARN: ${warning}`)
      totalWarnings++
    }

    lines.push('')
  }

  lines.push(`${totalFiles} files scanned, ${totalUpdated} updated, ${totalUnchanged} unchanged${totalWarnings ? `, ${totalWarnings} warnings` : ''}`)

  return lines.join('\n')
}
