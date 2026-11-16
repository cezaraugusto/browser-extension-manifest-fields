import * as fs from 'fs'
import * as path from 'path'

import {describe, it, expect, afterAll} from 'vitest'

import {getManifestFieldsData} from '../../manifest-fields'
import {blankJsonComments} from '../../internal/read-manifest-json'

const tmp = path.join(__dirname, '.tmp-manifest-comments')

const write = (name: string, text: string) => {
  const dir = path.join(tmp, name)

  fs.mkdirSync(dir, {recursive: true})
  fs.writeFileSync(path.join(dir, 'manifest.json'), text, 'utf8')

  return path.join(dir, 'manifest.json')
}

afterAll(() => {
  fs.rmSync(tmp, {recursive: true, force: true})
})

describe('getManifestFieldsData with comments', () => {
  it('reads a manifest with // comments, as Chromium and Firefox do', () => {
    const manifestPath = write(
      'line',
      [
        '// A note on the first line',
        '{',
        '  "name": "x", // after a value',
        '  // on its own line',
        '  "action": {"default_popup": "p.html"}',
        '}',
        '// and on the last line'
      ].join('\n')
    )

    const res = getManifestFieldsData({manifestPath, browser: 'chrome'})

    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'p.html')
    )
  })

  it('reads a manifest with /* */ comments', () => {
    const manifestPath = write(
      'block',
      '{\n  /* one line */\n  "action": {\n    /* two\n       lines */\n    "default_popup": "p.html"\n  }\n}'
    )

    const res = getManifestFieldsData({manifestPath, browser: 'chrome'})

    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'p.html')
    )
  })

  it('reads comments after a byte order mark', () => {
    const manifestPath = write(
      'bom',
      '﻿// note\n{"action": {"default_popup": "p.html"}}'
    )

    const res = getManifestFieldsData({manifestPath, browser: 'firefox'})

    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'p.html')
    )
  })

  it('keeps comment markers that sit inside a string', () => {
    const manifestPath = write(
      'string',
      '{"action": {"default_popup": "a//b/*c*/.html"}, "homepage_url": "https://example.com/"}'
    )

    const res = getManifestFieldsData({manifestPath, browser: 'chrome'})

    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'a//b/*c*/.html')
    )
  })

  it('still throws on a trailing comma, which no browser reads', () => {
    const manifestPath = write('comma', '{\n  "name": "x", // note\n}')

    expect(() =>
      getManifestFieldsData({manifestPath, browser: 'chrome'})
    ).toThrow(SyntaxError)
  })

  it('still throws on an unterminated block comment', () => {
    const manifestPath = write('open', '{"name": "x" /* never closed }')

    expect(() =>
      getManifestFieldsData({manifestPath, browser: 'chrome'})
    ).toThrow(SyntaxError)
  })
})

describe('blankJsonComments', () => {
  it('keeps the length and the line breaks of the text', () => {
    const source = '{\n  // note\n  "a": 1, /* b\n c */ "d": 2\n}'
    const out = blankJsonComments(source)

    expect(out.length).toBe(source.length)
    expect(out.split('\n').length).toBe(source.split('\n').length)
    expect(JSON.parse(out)).toEqual({a: 1, d: 2})
  })

  it('returns text without comments unchanged', () => {
    const source = '{"a": "b", "c": [1, 2]}'

    expect(blankJsonComments(source)).toBe(source)
  })
})
