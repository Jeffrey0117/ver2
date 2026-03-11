import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function hashFile(filePath, algorithm = 'md5', length = 8) {
  const content = readFileSync(filePath)
  const hash = createHash(algorithm).update(content).digest('hex')
  return hash.slice(0, length)
}

export function hashString(str, algorithm = 'md5', length = 8) {
  const hash = createHash(algorithm).update(str).digest('hex')
  return hash.slice(0, length)
}
