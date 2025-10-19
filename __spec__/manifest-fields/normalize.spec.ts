import {describe, it, expect} from 'vitest'
import * as path from 'path'
import {resolveManifestPath} from '../../manifest-fields/normalize'

const ctx = '/tmp/project'

describe('resolveManifestPath', () => {
  it('joins absolute-like "/foo" to context', () => {
    const p = resolveManifestPath(ctx, '/foo/bar.html')
    expect(p).toBe(path.join(ctx, 'foo/bar.html'))
  })

  it('handles "/public/foo"', () => {
    const p = resolveManifestPath(ctx, '/public/assets/logo.png')
    expect(p).toBe(path.join(ctx, 'public', 'assets/logo.png'))
  })

  it('handles "public/foo" and "./public/foo"', () => {
    expect(resolveManifestPath(ctx, 'public/img/a.png')).toBe(
      path.join(ctx, 'public', 'img/a.png')
    )
    expect(resolveManifestPath(ctx, './public/img/a.png')).toBe(
      path.join(ctx, 'public', 'img/a.png')
    )
  })

  it('joins plain relative like "foo/bar"', () => {
    expect(resolveManifestPath(ctx, 'foo/bar')).toBe(path.join(ctx, 'foo/bar'))
  })

  it('returns falsy same value when input is empty', () => {
    // @ts-expect-error testing runtime fallback
    expect(resolveManifestPath(ctx, '')).toBe('')
    // @ts-expect-error testing runtime fallback
    expect(resolveManifestPath(ctx, undefined)).toBeUndefined()
  })
})
