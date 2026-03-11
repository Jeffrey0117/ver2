import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rewriteReferences } from '../src/rewriter.js'
import { scanReferences } from '../src/scanner.js'
import { DEFAULT_CONFIG } from '../src/config.js'

const exts = DEFAULT_CONFIG.staticExtensions

describe('rewriteReferences', () => {
  it('adds ?v=hash to clean URLs', () => {
    const html = '<link href="style.css">'
    const refs = scanReferences(html, exts)
    const updates = [{ reference: refs[0], hash: 'abcd1234' }]
    const result = rewriteReferences(html, updates)
    assert.equal(result, '<link href="style.css?v=abcd1234">')
  })

  it('replaces existing ?v= param', () => {
    const html = '<link href="style.css?v=old">'
    const refs = scanReferences(html, exts)
    const updates = [{ reference: refs[0], hash: 'new12345' }]
    const result = rewriteReferences(html, updates)
    assert.equal(result, '<link href="style.css?v=new12345">')
  })

  it('preserves other query params', () => {
    const html = '<link href="style.css?v=old&theme=dark">'
    const refs = scanReferences(html, exts)
    const updates = [{ reference: refs[0], hash: 'abcd1234' }]
    const result = rewriteReferences(html, updates)
    assert.equal(result, '<link href="style.css?v=abcd1234&theme=dark">')
  })

  it('handles multiple references in one file', () => {
    const html = '<link href="style.css"><script src="app.js"></script>'
    const refs = scanReferences(html, exts)
    const updates = [
      { reference: refs[0], hash: 'csshhash' },
      { reference: refs[1], hash: 'jshhash1' },
    ]
    const result = rewriteReferences(html, updates)
    assert.equal(result, '<link href="style.css?v=csshhash"><script src="app.js?v=jshhash1"></script>')
  })

  it('preserves single quotes', () => {
    const html = "<script src='app.js'></script>"
    const refs = scanReferences(html, exts)
    const updates = [{ reference: refs[0], hash: 'abcd1234' }]
    const result = rewriteReferences(html, updates)
    assert.equal(result, "<script src='app.js?v=abcd1234'></script>")
  })

  it('preserves surrounding HTML', () => {
    const html = '<!DOCTYPE html>\n<html>\n<head>\n  <link href="style.css">\n</head>\n</html>'
    const refs = scanReferences(html, exts)
    const updates = [{ reference: refs[0], hash: 'abcd1234' }]
    const result = rewriteReferences(html, updates)
    assert.equal(result, '<!DOCTYPE html>\n<html>\n<head>\n  <link href="style.css?v=abcd1234">\n</head>\n</html>')
  })
})
