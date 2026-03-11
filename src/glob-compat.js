import { readdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', '.git', '.svn', '.hg'])

export function findFiles(dir, extensions = ['.html']) {
  const results = []

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && SKIP_DIRS.has(entry.name)) continue

      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
        walk(fullPath)
      } else if (entry.isFile() && extensions.includes(extname(entry.name).toLowerCase())) {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results.sort()
}
