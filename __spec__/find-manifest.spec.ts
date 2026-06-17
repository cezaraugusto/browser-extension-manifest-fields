import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import {describe, it, expect, afterEach} from 'vitest'

import {findManifestJsonPath} from '../find-manifest'

const tmpRoots: string[] = []

const makeTmp = () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'find-manifest-'))

  tmpRoots.push(tmp)

  return tmp
}

afterEach(() => {
  while (tmpRoots.length) {
    fs.rmSync(tmpRoots.pop() as string, {recursive: true, force: true})
  }
})

describe('findManifestJsonPath', () => {
  it('finds manifest.json at the project root', async () => {
    const tmp = makeTmp()

    fs.writeFileSync(path.join(tmp, 'manifest.json'), '{}')
    expect(await findManifestJsonPath(tmp)).toBe(
      path.join(tmp, 'manifest.json')
    )
  })

  it('prefers common locations in order', async () => {
    const tmp = makeTmp()

    fs.mkdirSync(path.join(tmp, 'src'))
    fs.mkdirSync(path.join(tmp, 'extension'))
    fs.writeFileSync(path.join(tmp, 'src', 'manifest.json'), '{}')
    fs.writeFileSync(path.join(tmp, 'extension', 'manifest.json'), '{}')
    expect(await findManifestJsonPath(tmp)).toBe(
      path.join(tmp, 'src', 'manifest.json')
    )
  })

  it('falls back to a shallow tree search', async () => {
    const tmp = makeTmp()
    const nested = path.join(tmp, 'apps', 'my-extension')

    fs.mkdirSync(nested, {recursive: true})
    fs.writeFileSync(path.join(nested, 'manifest.json'), '{}')
    expect(await findManifestJsonPath(tmp)).toBe(
      path.join(nested, 'manifest.json')
    )
  })

  it('ignores node_modules and .git', async () => {
    const tmp = makeTmp()
    const ignored = path.join(tmp, 'node_modules', 'some-pkg')

    fs.mkdirSync(ignored, {recursive: true})
    fs.writeFileSync(path.join(ignored, 'manifest.json'), '{}')
    await expect(findManifestJsonPath(tmp)).rejects.toThrow(
      /Could not locate manifest.json/
    )
  })

  it('does not search deeper than three levels', async () => {
    const tmp = makeTmp()
    const deep = path.join(tmp, 'a', 'b', 'c', 'd')

    fs.mkdirSync(deep, {recursive: true})
    fs.writeFileSync(path.join(deep, 'manifest.json'), '{}')
    await expect(findManifestJsonPath(tmp)).rejects.toThrow(
      /Could not locate manifest.json/
    )
  })
})
