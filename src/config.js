export const DEFAULT_CONFIG = {
  extensions: ['.html'],
  hashAlgorithm: 'md5',
  hashLength: 8,
  paramName: 'v',
  prefixMap: {},
  dryRun: false,
  staticExtensions: [
    '.js', '.css',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
    '.woff', '.woff2', '.ttf', '.eot',
    '.mp3', '.mp4', '.webm',
  ],
  verbose: false,
}

export function mergeConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides }
}
