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
