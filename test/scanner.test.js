import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { scanReferences } from '../src/scanner.js'
import { DEFAULT_CONFIG } from '../src/config.js'

const exts = DEFAULT_CONFIG.staticExtensions

describe('scanReferences', () => {
  it('extracts src and href attributes', () => {
    const html = '<link href="style.css"><script src="app.js"></script>'
    const refs = scanReferences(html, exts)
    assert.equal(refs.length, 2)
    assert.equal(refs[0].attribute, 'href')
    assert.equal(refs[0].urlWithoutQuery, 'style.css')
    assert.equal(refs[1].attribute, 'src')
    assert.equal(refs[1].urlWithoutQuery, 'app.js')
  })

  it('handles single quotes', () => {
    const html = "<script src='app.js'></script>"
    const refs = scanReferences(html, exts)
    assert.equal(refs.length, 1)
    assert.equal(refs[0].quote, "'")
    assert.equal(refs[0].urlWithoutQuery, 'app.js')
  })

  it('skips external URLs', () => {
    const html = `
      <link href="https://cdn.example.com/lib.css">
      <link href="//cdn.example.com/lib.css">
      <link href="http://cdn.example.com/lib.css">
      <link href="style.css">
    `
    const refs = scanReferences(html, exts)
    assert.equal(refs.length, 1)
    assert.equal(refs[0].urlWithoutQuery, 'style.css')
  })

  it('skips data URIs, mailto, tel, javascript, anchors', () => {
    const html = `
      <img src="data:image/png;base64,abc">
      <a href="mailto:test@test.com">
      <a href="tel:123">
      <a href="javascript:void(0)">
      <a href="#section">
      <script src="app.js"></script>
    `
    const refs = scanReferences(html, exts)
    assert.equal(refs.length, 1)
    assert.equal(refs[0].urlWithoutQuery, 'app.js')
  })

  it('skips URLs without static file extensions', () => {
    const html = `
      <a href="/about">About</a>
      <a href="/api/data">API</a>
      <script src="app.js"></script>
    `
    const refs = scanReferences(html, exts)
    assert.equal(refs.length, 1)
  })

  it('parses existing ?v= param', () => {
    const html = '<link href="style.css?v=abc123">'
    const refs = scanReferences(html, exts)
    assert.equal(refs[0].existingParam, 'abc123')
    assert.equal(refs[0].urlWithoutQuery, 'style.css')
  })

  it('parses multiple query params', () => {
    const html = '<script src="app.js?v=old&debug=1"></script>'
    const refs = scanReferences(html, exts)
    assert.equal(refs[0].existingParam, 'old')
    assert.equal(refs[0].otherParams, 'debug=1')
  })

  it('handles v= not being the first param', () => {
    const html = '<script src="app.js?debug=1&v=old"></script>'
    const refs = scanReferences(html, exts)
    assert.equal(refs[0].existingParam, 'old')
    assert.equal(refs[0].otherParams, 'debug=1')
  })

  it('handles URLs with no ?v= param', () => {
    const html = '<link href="style.css">'
    const refs = scanReferences(html, exts)
    assert.equal(refs[0].existingParam, null)
    assert.equal(refs[0].otherParams, '')
  })

  it('handles absolute paths', () => {
    const html = '<link href="/static/style.css">'
    const refs = scanReferences(html, exts)
    assert.equal(refs[0].urlWithoutQuery, '/static/style.css')
  })
})
