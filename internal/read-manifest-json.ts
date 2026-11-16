import * as fs from 'fs'

// Comments become spaces of the same length, so every line and column that
// JSON.parse reports still points at the file as the author wrote it.
export function blankJsonComments (source: string): string {
  const raw = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source
  let out = ''
  let i = 0

  while (i < raw.length) {
    const char = raw[i]

    if (char === '"') {
      let j = i + 1

      while (j < raw.length && raw[j] !== '"' && raw[j] !== '\n') {
        j += raw[j] === '\\' ? 2 : 1
      }

      out += raw.slice(i, j + 1)
      i = j + 1
      continue
    }

    if (char === '/' && raw[i + 1] === '/') {
      let j = i

      while (j < raw.length && raw[j] !== '\n' && raw[j] !== '\r') j++

      out += ' '.repeat(j - i)
      i = j
      continue
    }

    if (char === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2)

      // An unterminated comment stays in place and fails the parse there.
      if (end !== -1) {
        out += raw.slice(i, end + 2).replace(/[^\r\n]/g, ' ')
        i = end + 2
        continue
      }
    }

    out += char
    i++
  }

  return out
}

// Chromium and Firefox both load an unpacked manifest.json that has a
// byte order mark or comments, so neither is a reason to throw here.
export function readManifestJson (manifestPath: string): any {
  return JSON.parse(blankJsonComments(fs.readFileSync(manifestPath, 'utf8')))
}
