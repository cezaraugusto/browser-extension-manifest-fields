import {describe, it, expect} from 'vitest'

import {filterKeysForThisBrowser} from '../browser-prefix-fields'

const manifest = {
  manifest_version: 3,
  name: 'Test',
  'chromium:permissions': ['storage'],
  'firefox:permissions': ['tabs'],
  'edge:short_name': 'EdgeTest',
  'gecko:browser_specific_settings': {gecko: {id: 'test@test'}},
  'safari:short_name': 'SafariTest'
}

describe('filterKeysForThisBrowser', () => {
  it('resolves chromium-prefixed keys for chrome', () => {
    const result = filterKeysForThisBrowser(manifest, 'chrome')

    expect(result.permissions).toEqual(['storage'])
    expect(result['chromium:permissions']).toBeUndefined()
    expect(result.browser_specific_settings).toBeUndefined()
  })

  it('resolves edge- and chromium-prefixed keys for edge', () => {
    const result = filterKeysForThisBrowser(manifest, 'edge')

    expect(result.permissions).toEqual(['storage'])
    expect(result.short_name).toBe('EdgeTest')
  })

  it('resolves firefox- and gecko-prefixed keys for firefox', () => {
    const result = filterKeysForThisBrowser(manifest, 'firefox')

    expect(result.permissions).toEqual(['tabs'])
    expect(result.browser_specific_settings).toEqual({
      gecko: {id: 'test@test'}
    })
    expect(result.short_name).toBeUndefined()
  })

  it('resolves chromium- and safari-prefixed keys for safari', () => {
    const result = filterKeysForThisBrowser(manifest, 'safari')

    expect(result.permissions).toEqual(['storage'])
    expect(result.short_name).toBe('SafariTest')
  })

  it('matches engine-family targets like chromium-based and gecko-based', () => {
    expect(
      filterKeysForThisBrowser(manifest, 'chromium-based').permissions
    ).toEqual(['storage'])
    expect(
      filterKeysForThisBrowser(manifest, 'gecko-based').permissions
    ).toEqual(['tabs'])
  })

  it('treats firefox-based as a gecko target', () => {
    expect(
      filterKeysForThisBrowser(manifest, 'firefox-based').permissions
    ).toEqual(['tabs'])
  })

  it('resolves chromium keys for chromium forks (brave/opera/vivaldi/yandex)', () => {
    for (const browser of ['brave', 'opera', 'vivaldi', 'yandex']) {
      const result = filterKeysForThisBrowser(manifest, browser)
      expect(result.permissions).toEqual(['storage'])
      expect(result.short_name).toBe('EdgeTest')
      expect(result.browser_specific_settings).toBeUndefined()
    }
  })

  it('resolves gecko keys for gecko forks (waterfox/librewolf)', () => {
    for (const browser of ['waterfox', 'librewolf']) {
      const result = filterKeysForThisBrowser(manifest, browser)
      expect(result.permissions).toEqual(['tabs'])
      expect(result.browser_specific_settings).toEqual({
        gecko: {id: 'test@test'}
      })
      expect(result.short_name).toBeUndefined()
    }
  })

  it('keeps unprefixed keys and does not mutate the input', () => {
    const result = filterKeysForThisBrowser(manifest, 'chrome')

    expect(result.manifest_version).toBe(3)
    expect(result.name).toBe('Test')
    expect(manifest['chromium:permissions']).toEqual(['storage'])
    expect((manifest as Record<string, unknown>).permissions).toBeUndefined()
  })
})

describe('filterKeysForThisBrowser precedence', () => {
  const both = {
    'chrome:devtools_page': 'devtools/chrome.html',
    'chromium:devtools_page': 'devtools/family.html'
  }

  it('prefers the specific browser key over its family, whatever the order', () => {
    expect(filterKeysForThisBrowser(both, 'chrome').devtools_page).toBe(
      'devtools/chrome.html'
    )

    const swapped = {
      'chromium:devtools_page': 'devtools/family.html',
      'chrome:devtools_page': 'devtools/chrome.html'
    }
    expect(filterKeysForThisBrowser(swapped, 'chrome')).toEqual(
      filterKeysForThisBrowser(both, 'chrome')
    )
  })

  it('applies the same rule on the gecko side', () => {
    const gecko = {
      'gecko:devtools_page': 'devtools/family.html',
      'firefox:devtools_page': 'devtools/firefox.html'
    }
    expect(filterKeysForThisBrowser(gecko, 'firefox').devtools_page).toBe(
      'devtools/firefox.html'
    )
  })

  it('resolves a webkit-prefixed key for safari instead of dropping it', () => {
    const webkit = {'webkit:devtools_page': 'devtools/safari.html'}
    expect(filterKeysForThisBrowser(webkit, 'safari').devtools_page).toBe(
      'devtools/safari.html'
    )
    expect(filterKeysForThisBrowser(webkit, 'webkit-based').devtools_page).toBe(
      'devtools/safari.html'
    )
  })

  it('lets a webkit key beat the chromium family safari also inherits', () => {
    const mixed = {
      'webkit:devtools_page': 'devtools/safari.html',
      'chromium:devtools_page': 'devtools/family.html'
    }
    expect(filterKeysForThisBrowser(mixed, 'safari').devtools_page).toBe(
      'devtools/safari.html'
    )
  })

  it('leaves a plain-key manifest byte identical', () => {
    const plain = {manifest_version: 3, name: 'Test', devtools_page: 'a.html'}
    expect(JSON.stringify(filterKeysForThisBrowser(plain, 'chrome'))).toBe(
      JSON.stringify(plain)
    )
  })

  it('keeps a family key covering that family fork browsers', () => {
    const family = {'chromium:short_name': 'Fam'}
    expect(filterKeysForThisBrowser(family, 'brave').short_name).toBe('Fam')
    expect(filterKeysForThisBrowser(family, 'edge').short_name).toBe('Fam')
    const gecko = {'gecko:short_name': 'Fam'}
    expect(filterKeysForThisBrowser(gecko, 'waterfox').short_name).toBe('Fam')
  })

  it('resolves prefixed keys nested inside objects and arrays', () => {
    const nested = {
      content_scripts: [
        {'chrome:js': ['a.js'], 'chromium:js': ['b.js'], matches: ['<all_urls>']}
      ]
    }
    const out = filterKeysForThisBrowser(nested, 'chrome') as any
    expect(out.content_scripts[0].js).toEqual(['a.js'])
  })
})
