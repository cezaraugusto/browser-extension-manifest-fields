import {describe, it, expect} from 'vitest'

import {themeFields} from '../../manifest-fields/theme-fields'

describe('themeFields', () => {
  it('returns undefined when no theme/images', () => {
    const out = themeFields('/root/app', {})

    expect(out).toBeUndefined()
  })

  it('maps theme images to theme/images/<basename>', () => {
    const manifest = {
      theme: {
        images: {
          frame: 'images/frame.png',
          toolbar: '/images/toolbar.svg',
          header: '/abs/os/path/header.jpg'
        }
      }
    }

    const out = themeFields('/root/app', manifest)!

    expect(out['theme/images/frame.png']).toBe('/root/app/images/frame.png')
    // Leading '/' resolves from extension root (manifest directory)
    expect(out['theme/images/toolbar.svg']).toBe('/root/app/images/toolbar.svg')
    // OS-absolute not supported by spec; leading '/' is treated as extension root
    expect(out['theme/images/header.jpg']).toBe(
      '/root/app/abs/os/path/header.jpg'
    )
  })

  it('ignores non-string entries', () => {
    const manifest = {theme: {images: {foo: 123}}}
    const out = themeFields('/root/app', manifest)

    expect(out).toBeUndefined()
  })
})
