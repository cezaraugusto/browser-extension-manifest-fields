import {describe, it, expect, beforeEach} from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
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
    // default mode: key is relative path including extension
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
    // no entry for .txt
    expect(Object.keys(res.scripts).some((k) => k.endsWith('/c'))).toBe(false)
  })
})
