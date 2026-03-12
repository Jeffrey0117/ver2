# ver2

CLI tool for automatic content-hash cache-busting on HTML static file references. Zero dependencies.

## What It Does

Scans HTML files, finds local `src="..."` and `href="..."` references to static files (`.js`, `.css`, `.png`, etc.), computes MD5 hash of each file's content, and adds/updates `?v={hash}` query parameter.

```
Before:  <link href="/style.css">         or  <link href="/style.css?v=old">
After:   <link href="/style.css?v=39258372">
```

## Why

CloudPipe sub-projects serve static HTML without bundlers (no Webpack/Vite). Cloudflare caches aggressively. After deploy, users see stale CSS/JS. ver2 solves this in one command.

## Install

```bash
npm install -g ver2-cli    # global
npx ver2-cli ./public      # or use directly
```

## Usage

### CLI

```bash
# Basic: hash all static refs in HTML files
ver2 ./public

# Preview without writing
ver2 ./public --dry-run

# Strip URL prefix (Fastify/Express static serving)
ver2 ./public --strip /static/

# Custom hash length (default: 8)
ver2 ./public --length 12

# Custom query param name (default: v)
ver2 ./public --param hash
```

### Programmatic API

```js
import { ver2 } from 'ver2-cli'

const results = ver2('./public', {
  prefixMap: { '/static/': '.' },
  dryRun: false,
  hashLength: 8,
  paramName: 'v',
})

for (const file of results) {
  console.log(file.relativePath, file.updates.length, 'references updated')
}
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Preview changes without writing | `false` |
| `--strip <prefix>` | Strip URL prefix before resolving | — |
| `--prefix <url> <dir>` | Map URL prefix to directory | — |
| `--param <name>` | Query parameter name | `v` |
| `--length <n>` | Hash length in characters | `8` |
| `--ext <list>` | File extensions to scan (comma-separated) | `.html` |
| `--verbose` | Show detailed output | `false` |

## Architecture

```
bin/ver2.js       — CLI entry point (arg parsing)
src/index.js      — Main export: ver2(target, options) → results[]
src/config.js     — Default config + merge logic
src/scanner.js    — Regex-based HTML src/href extraction
src/hasher.js     — MD5 content hashing (Node crypto)
src/resolver.js   — URL → file path resolution (handles prefix mapping)
src/rewriter.js   — HTML string replacement (preserves formatting)
src/reporter.js   — CLI output formatting
src/glob-compat.js — Recursive .html file finder (Node fs)
```

## Properties

- **Idempotent** — running twice produces no changes on second run
- **Non-destructive** — only modifies `?v=` param, preserves all HTML formatting
- **Safe** — missing files produce warnings, not crashes
- **Fast** — 100+ HTML files in under a second
- **Zero dependencies** — only Node.js built-ins

## Supported Static File Types

`.js` `.css` `.png` `.jpg` `.jpeg` `.gif` `.svg` `.ico` `.webp` `.avif` `.woff` `.woff2` `.ttf` `.eot` `.mp3` `.mp4` `.webm`

## Integration with CloudPipe

### In deploy pipeline (post-build)

Add to any sub-project's `package.json`:

```json
{
  "scripts": {
    "postbuild": "ver2 ./public"
  }
}
```

### In Pokkit (runtime template)

For server-rendered HTML (like Pokkit's download page), compute hash at startup:

```js
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const cssHash = createHash('md5')
  .update(readFileSync('./public/style.css'))
  .digest('hex')
  .substring(0, 8)

// Use in template: `/style.css?v=${cssHash}`
```

### Which CloudPipe projects should use ver2

Any project serving static HTML without a bundler:
- Pokkit (Fastify + static HTML) — already integrated
- AdMan (Next.js) — handled by Next.js built-in hashing
- RawTxt, Quickky, MySpeedTest — candidates for ver2

## Code Style

- ESM (`"type": "module"`)
- Zero dependencies
- Node.js >= 18
- `node --test` for testing

## Windows Gotcha

Git Bash (MSYS2) mangles `/foo/` paths into `C:/Program Files/Git/foo/`. The CLI auto-detects and fixes this via `fixMsysPath()`.
