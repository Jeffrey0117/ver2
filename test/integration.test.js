import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { ver2 } from '../src/index.js'
import { hashFile } from '../src/hasher.js'

const fixturesDir = resolve(import.meta.dirname, 'fixtures')

function copyFixture(name) {
  const src = join(fixturesDir, name)
  const tmp = mkdtempSync(join(tmpdir(), 'ver2-test-'))
  cpSync(src, tmp, { recursive: true })
  return tmp
}

describe('integration: basic', () => {
  it('adds ?v=hash to clean HTML references', () => {
    const dir = copyFixture('basic')
    const results = ver2(dir)

    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    const cssHash = hashFile(join(dir, 'style.css'))
    const jsHash = hashFile(join(dir, 'app.js'))

    assert.ok(html.includes(`href="style.css?v=${cssHash}"`))
    assert.ok(html.includes(`src="app.js?v=${jsHash}"`))
    assert.equal(results[0].updates.length, 2)

    rmSync(dir, { recursive: true })
  })
})

describe('integration: existing versions', () => {
  it('replaces old ?v= params with content hash', () => {
    const dir = copyFixture('existing-versions')
    ver2(dir)

    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    const cssHash = hashFile(join(dir, 'style.css'))
    const jsHash = hashFile(join(dir, 'app.js'))

    assert.ok(html.includes(`href="style.css?v=${cssHash}"`))
    assert.ok(html.includes(`src="app.js?v=${jsHash}"`))
    assert.ok(!html.includes('?v=oldhash1'))
    assert.ok(!html.includes('?v=999'))

    rmSync(dir, { recursive: true })
  })
})

describe('integration: external URLs', () => {
  it('only hashes local files, skips external', () => {
    const dir = copyFixture('external-urls')
    ver2(dir)

    const html = readFileSync(join(dir, 'index.html'), 'utf8')

    assert.ok(html.includes('https://cdn.example.com/lib.css'))
    assert.ok(html.includes('//cdn.example.com/lib.js'))
    assert.ok(html.includes('mailto:test@example.com'))
    assert.ok(html.includes('href="style.css?v='))
    assert.ok(html.includes('src="app.js?v='))

    rmSync(dir, { recursive: true })
  })
})

describe('integration: missing files', () => {
  it('warns about missing files without crashing', () => {
    const dir = copyFixture('missing-files')
    const results = ver2(dir)

    assert.ok(results[0].warnings.length > 0)
    assert.ok(results[0].warnings.some(w => w.includes('missing.css')))

    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    assert.ok(html.includes('href="style.css?v='))
    assert.ok(html.includes('href="missing.css"'))

    rmSync(dir, { recursive: true })
  })
})

describe('integration: multi query params', () => {
  it('preserves other query params', () => {
    const dir = copyFixture('multi-query')
    ver2(dir)

    const html = readFileSync(join(dir, 'index.html'), 'utf8')

    assert.ok(html.includes('theme=dark'))
    assert.ok(html.includes('debug=1'))
    assert.ok(!html.includes('v=old'))

    rmSync(dir, { recursive: true })
  })
})

describe('integration: prefix mapping', () => {
  it('resolves /static/ prefix to local directory', () => {
    const dir = copyFixture('prefixed')
    const results = ver2(dir, { prefixMap: { '/static/': '.' } })

    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    const cssHash = hashFile(join(dir, 'style.css'))
    const jsHash = hashFile(join(dir, 'app.js'))

    assert.ok(html.includes(`href="/static/style.css?v=${cssHash}"`))
    assert.ok(html.includes(`src="/static/app.js?v=${jsHash}"`))

    rmSync(dir, { recursive: true })
  })
})

describe('integration: dry run', () => {
  it('does not modify files in dry-run mode', () => {
    const dir = copyFixture('basic')
    const originalHtml = readFileSync(join(dir, 'index.html'), 'utf8')

    const results = ver2(dir, { dryRun: true })

    const afterHtml = readFileSync(join(dir, 'index.html'), 'utf8')
    assert.equal(originalHtml, afterHtml)
    assert.ok(results[0].updates.length > 0)

    rmSync(dir, { recursive: true })
  })
})

describe('integration: idempotent', () => {
  it('running twice produces no changes on second run', () => {
    const dir = copyFixture('basic')

    ver2(dir)
    const afterFirst = readFileSync(join(dir, 'index.html'), 'utf8')

    const results = ver2(dir)
    const afterSecond = readFileSync(join(dir, 'index.html'), 'utf8')

    assert.equal(afterFirst, afterSecond)
    assert.ok(results[0].updates.every(u => !u.changed))

    rmSync(dir, { recursive: true })
  })
})
