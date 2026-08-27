import * as fs from 'fs'
import * as path from 'path'

import {describe, it, expect, beforeEach} from 'vitest'

import {
  scanFilesInFolder,
  generateEntries
} from '../../special-folders/generate-entries'
import {getSpecialFoldersData} from '../../special-folders'

const makeTree = (root: string, files: string[]) => {
  for (const file of files) {
    const abs = path.join(root, file)

    fs.mkdirSync(path.dirname(abs), {recursive: true})
    fs.writeFileSync(abs, 'x', 'utf8')
  }
}

describe('special folders helpers', () => {
  const tmp = path.join(__dirname, '.tmp-folders')

  beforeEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true})
    fs.mkdirSync(tmp, {recursive: true})
  })

  it('scanFilesInFolder returns [] for missing/empty', () => {
    expect(scanFilesInFolder(path.join(tmp, 'none'), () => true)).toEqual([])
  })

  it('scanFilesInFolder recurses and filters by callback', () => {
    makeTree(tmp, ['a/x.js', 'a/y.css', 'b/c/z.html'])
    const js = scanFilesInFolder(tmp, (name) => name.endsWith('.js'))

    expect(js.sort()).toEqual([path.join(tmp, 'a/x.js')])
  })

  it('generateEntries default mode uses mapping key or relative path', () => {
    const project = tmp
    const includes = [
      path.join(project, 'public/logo.png'),
      path.join(project, 'scripts/main.ts')
    ]

    const map = generateEntries(project, includes)

    expect(map[path.join('public', 'logo.png')]).toBe(
      path.join(project, 'public/logo.png')
    )
    // Default mode: key is relative path including extension
    expect(map[path.join('scripts', 'main.ts')]).toBe(
      path.join(project, 'scripts/main.ts')
    )
  })

  it('generateEntries pages mode preserves nested path and collapses /index', () => {
    const project = tmp
    const includes = [
      path.join(project, 'pages/index.html'),
      path.join(project, 'pages/docs/index.html'),
      path.join(project, 'pages/blog/post.html')
    ]

    const map = generateEntries(project, includes, 'pages')

    expect(map['pages/index']).toBe(path.join(project, 'pages/index.html'))
    expect(map['pages/docs']).toBe(path.join(project, 'pages/docs/index.html'))
    expect(map['pages/blog/post']).toBe(
      path.join(project, 'pages/blog/post.html')
    )
  })

  it('getSpecialFoldersData discovers case-insensitive public folder and filters pages/scripts', () => {
    const project = tmp

    makeTree(project, [
      'Public/img.png',
      'pages/home.html',
      'pages/skip.txt',
      'scripts/a.js',
      'scripts/b.ts',
      'scripts/c.txt'
    ])
    const manifestPath = path.join(project, 'manifest.json')

    fs.writeFileSync(manifestPath, '{}', 'utf8')
    const res = getSpecialFoldersData({manifestPath} as any)

    expect(Object.keys(res.public)).toHaveLength(1)
    expect(res.pages['pages/home']).toBe(path.join(project, 'pages/home.html'))
    expect(res.scripts['scripts/a']).toBe(path.join(project, 'scripts/a.js'))
    expect(res.scripts['scripts/b']).toBe(path.join(project, 'scripts/b.ts'))
    // No entry for .txt
    expect(Object.keys(res.scripts).some((k) => k.endsWith('/c'))).toBe(false)
  })

  // Regression: keying scripts/ by basename made scripts/a/inject.js and
  // scripts/b/inject.js one entry, and the last file scanned silently replaced
  // the other. One file shipped and both manifest references pointed nowhere.
  it('getSpecialFoldersData keeps nested scripts/ paths distinct', () => {
    const project = tmp

    makeTree(project, [
      'scripts/a/inject.js',
      'scripts/b/inject.js',
      'scripts/inject.js',
      'scripts/deep/nested/tool.ts'
    ])
    const manifestPath = path.join(project, 'manifest.json')

    fs.writeFileSync(manifestPath, '{}', 'utf8')
    const res = getSpecialFoldersData({manifestPath} as any)

    expect(res.scripts['scripts/a/inject']).toBe(
      path.join(project, 'scripts/a/inject.js')
    )
    expect(res.scripts['scripts/b/inject']).toBe(
      path.join(project, 'scripts/b/inject.js')
    )
    expect(res.scripts['scripts/inject']).toBe(
      path.join(project, 'scripts/inject.js')
    )
    expect(res.scripts['scripts/deep/nested/tool']).toBe(
      path.join(project, 'scripts/deep/nested/tool.ts')
    )
    expect(Object.keys(res.scripts)).toHaveLength(4)
  })

  // A script named index.js is a file, not a route: only pages/ collapses it.
  it('getSpecialFoldersData never collapses a nested scripts/ index', () => {
    const project = tmp

    makeTree(project, ['scripts/worker/index.js', 'pages/blog/index.html'])
    const manifestPath = path.join(project, 'manifest.json')

    fs.writeFileSync(manifestPath, '{}', 'utf8')
    const res = getSpecialFoldersData({manifestPath} as any)

    expect(res.scripts['scripts/worker/index']).toBe(
      path.join(project, 'scripts/worker/index.js')
    )
    expect(res.pages['pages/blog']).toBe(
      path.join(project, 'pages/blog/index.html')
    )
  })
})
