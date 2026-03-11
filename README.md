# ver2

Auto-add content-hash cache-busting query params to HTML static file references. Zero dependencies.

```
Before:  <link href="/static/style.css?v=6">
After:   <link href="/static/style.css?v=39258372">
```

No more manually bumping `?v=6` to `?v=7`. ver2 reads the actual file content, computes an MD5 hash, and updates the query param automatically. If the file hasn't changed, the hash stays the same.

## Why

If you serve static files with vanilla HTML (no Webpack, no Vite) and your CDN caches aggressively (looking at you, Cloudflare), you need cache-busting. The existing npm packages are either abandoned, require special HTML attributes, or only rename files.

ver2 does one thing well: scan HTML, hash files, update `?v=`.

## Install

```bash
npm install -g ver2-cli
```

Or use directly with npx:

```bash
npx ver2-cli ./public
```

## Usage

```bash
# Basic: scan all HTML files in a directory
ver2 ./public

# Preview changes without writing
ver2 ./public --dry-run

# URL prefix mapping (e.g. Fastify/Express static prefix)
ver2 ./public --strip /static/

# Custom hash length (default: 8)
ver2 ./public --length 12

# Custom query param name (default: v)
ver2 ./public --param hash
```

## Prefix Mapping

If your HTML references `/static/style.css` but the file lives at `./public/style.css` (common with Fastify/Express static serving), use `--strip`:

```bash
# Strips /static/ from URLs before looking up files
ver2 ./public --strip /static/
```

For advanced cases where the static directory differs from the target:

```bash
# /assets/main.js -> look in ./dist/assets/main.js
ver2 ./public --prefix /assets/ ./dist/assets
```

## Output

```
ver2 v0.1.0

index.html
  /static/style.css  ?v=6 -> ?v=39258372
  /static/app.js     ?v=6 -> ?v=27362df0

dashboard.html
  /static/style.css  ?v=6 -> ?v=39258372  (unchanged)
  /static/dashboard.js  ?v=6 -> ?v=30be3214

2 files scanned, 3 updated, 1 unchanged
```

## Programmatic API

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

## CI / Deploy Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "cachebust": "ver2 ./public --strip /static/"
  }
}
```

Or use in a CI build command:

```bash
npm install && npx ver2-cli ./public --strip /static/
```

## How It Works

1. Recursively finds all `.html` files in the target directory
2. Scans each HTML for `src="..."` and `href="..."` attributes
3. Skips external URLs (`https://`, `//`, `data:`, etc.)
4. Resolves each local reference to a file on disk
5. Computes MD5 hash of the file content (first 8 chars)
6. Adds `?v={hash}` or replaces existing `?v=` value
7. Only writes the file if something actually changed

Properties:
- **Idempotent** — running twice produces no changes on the second run
- **Non-destructive** — preserves all HTML formatting, only modifies the `?v=` param
- **Safe** — missing files produce warnings, not crashes
- **Fast** — processes 100+ HTML files in under a second

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

## Supported File Types

ver2 hashes references to these static file types:

`.js` `.css` `.png` `.jpg` `.jpeg` `.gif` `.svg` `.ico` `.webp` `.avif` `.woff` `.woff2` `.ttf` `.eot` `.mp3` `.mp4` `.webm`

## Requirements

- Node.js >= 18
- Zero dependencies (uses only Node built-ins)

## License

MIT
