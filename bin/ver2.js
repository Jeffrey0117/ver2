#!/usr/bin/env node

import { ver2 } from '../src/index.js'
import { formatResults } from '../src/reporter.js'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function showHelp() {
  console.log(`
ver2 v${pkg.version}
Auto-add content-hash cache-busting query params to HTML static file references.

Usage:
  ver2 <directory> [options]

Arguments:
  directory          Directory containing HTML files to process

Options:
  --dry-run          Preview changes without writing files
  --strip <prefix>   Strip URL prefix before resolving (e.g. --strip /static/)
                     Files are looked up relative to target directory
  --prefix <url> <dir>  Map URL prefix to directory (e.g. --prefix /static/ ./public)
                     Can be used multiple times
  --param <name>     Query parameter name (default: "v")
  --length <n>       Hash length in characters (default: 8)
  --ext <list>       Comma-separated file extensions to scan (default: ".html")
  --verbose          Show detailed output
  --help             Show this help message
  --version          Show version number

Examples:
  ver2 ./public
  ver2 ./public --dry-run
  ver2 ./public --strip /static/
  ver2 ./dist --prefix /static/ ./public --length 12
`.trim())
}

// Git Bash on Windows mangles /foo/ into C:/Program Files/Git/foo/
// Detect and fix this by checking for known MSYS2 path patterns
function fixMsysPath(val) {
  const msysMatch = val.match(/^[A-Z]:\/Program Files\/Git\/(.+)/i)
  if (msysMatch) return `/${msysMatch[1]}`
  return val
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const config = { targets: [], prefixMap: {} }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        config.dryRun = true
        break
      case '--strip': {
        const prefix = fixMsysPath(args[++i] || '')
        if (!prefix) {
          console.error('Error: --strip requires a URL prefix (e.g. --strip /static/)')
          process.exit(1)
        }
        config.prefixMap[prefix] = '.'
        break
      }
      case '--prefix': {
        const urlPrefix = fixMsysPath(args[++i] || '')
        const dir = args[++i]
        if (!urlPrefix || !dir) {
          console.error('Error: --prefix requires two arguments (e.g. --prefix /static/ ./public)')
          process.exit(1)
        }
        config.prefixMap[urlPrefix] = dir
        break
      }
      case '--param':
        config.paramName = args[++i]
        break
      case '--length':
        config.hashLength = parseInt(args[++i], 10)
        break
      case '--ext':
        config.extensions = args[++i].split(',').map(e =>
          e.startsWith('.') ? e : `.${e}`
        )
        break
      case '--verbose':
        config.verbose = true
        break
      case '--help':
      case '-h':
        showHelp()
        process.exit(0)
        break
      case '--version':
      case '-v':
        console.log(pkg.version)
        process.exit(0)
        break
      default:
        if (args[i].startsWith('-')) {
          console.error(`Unknown option: ${args[i]}`)
          process.exit(1)
        }
        config.targets.push(args[i])
    }
  }

  return config
}

function main() {
  const config = parseArgs(process.argv)

  if (config.targets.length === 0) {
    console.error('Error: Please provide a directory path.\n')
    showHelp()
    process.exit(1)
  }

  const target = config.targets[0]
  const results = ver2(target, config)
  const output = formatResults(results, config.dryRun)
  console.log(output)

  const totalUpdated = results.reduce((sum, r) =>
    sum + r.updates.filter(u => u.changed).length, 0
  )

  process.exit(totalUpdated > 0 || config.dryRun ? 0 : 0)
}

main()
