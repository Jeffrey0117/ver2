import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hashFile, hashString } from '../src/hasher.js'
import { resolve } from 'node:path'

const fixturesDir = resolve(import.meta.dirname, 'fixtures')

describe('hashFile', () => {
  it('returns 8-char hash by default', () => {
    const hash = hashFile(resolve(fixturesDir, 'basic/style.css'))
    assert.equal(hash.length, 8)
    assert.match(hash, /^[0-9a-f]{8}$/)
  })

  it('returns consistent hash for same file', () => {
    const path = resolve(fixturesDir, 'basic/style.css')
    const hash1 = hashFile(path)
    const hash2 = hashFile(path)
    assert.equal(hash1, hash2)
  })

  it('returns different hash for different files', () => {
    const hash1 = hashFile(resolve(fixturesDir, 'basic/style.css'))
    const hash2 = hashFile(resolve(fixturesDir, 'basic/app.js'))
    assert.notEqual(hash1, hash2)
  })

  it('respects custom hash length', () => {
    const hash = hashFile(resolve(fixturesDir, 'basic/style.css'), 'md5', 12)
    assert.equal(hash.length, 12)
  })
})

describe('hashString', () => {
  it('returns consistent hash for same string', () => {
    const hash1 = hashString('hello')
    const hash2 = hashString('hello')
    assert.equal(hash1, hash2)
  })

  it('returns different hash for different strings', () => {
    const hash1 = hashString('hello')
    const hash2 = hashString('world')
    assert.notEqual(hash1, hash2)
  })
})
