import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveFilePath } from '../src/resolver.js'
import { resolve, normalize } from 'node:path'

describe('resolveFilePath', () => {
  const rootDir = resolve('/project/public')
  const htmlFile = resolve('/project/public/index.html')

  it('resolves relative paths from HTML file directory', () => {
    const result = resolveFilePath('style.css', htmlFile, rootDir)
    assert.equal(result, normalize(resolve('/project/public/style.css')))
  })

  it('resolves absolute paths from root directory', () => {
    const result = resolveFilePath('/style.css', htmlFile, rootDir)
    assert.equal(result, normalize(resolve('/project/public/style.css')))
  })

  it('applies prefix mapping', () => {
    const prefixMap = { '/static/': '.' }
    const result = resolveFilePath('/static/style.css', htmlFile, rootDir, prefixMap)
    assert.equal(result, normalize(resolve('/project/public/style.css')))
  })

  it('strips query params before resolving', () => {
    const result = resolveFilePath('style.css?v=123', htmlFile, rootDir)
    assert.equal(result, normalize(resolve('/project/public/style.css')))
  })

  it('strips fragment before resolving', () => {
    const result = resolveFilePath('style.css#section', htmlFile, rootDir)
    assert.equal(result, normalize(resolve('/project/public/style.css')))
  })

  it('handles nested prefix paths', () => {
    const prefixMap = { '/assets/': './dist/assets' }
    const result = resolveFilePath('/assets/main.js', htmlFile, rootDir, prefixMap)
    assert.equal(result, normalize(resolve('/project/public/dist/assets/main.js')))
  })
})
