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
      expect(result.short_name).toBeUndefined()
      expect(result.browser_specific_settings).toBeUndefined()
    }
  })

  it('resolves gecko keys for gecko forks (waterfox/librewolf/zen/floorp)', () => {
    for (const browser of ['waterfox', 'librewolf', 'zen', 'floorp']) {
      const result = filterKeysForThisBrowser(manifest, browser)
      expect(result.permissions).toEqual(['tabs'])
      expect(result.browser_specific_settings).toEqual({
        gecko: {id: 'test@test'}
      })
      expect(result.short_name).toBeUndefined()
    }
  })

  it('every gecko fork resolves a manifest identically to firefox', () => {
    const onFirefox = filterKeysForThisBrowser(manifest, 'firefox')
    for (const browser of ['waterfox', 'librewolf', 'zen', 'floorp']) {
      expect(filterKeysForThisBrowser(manifest, browser)).toEqual(onFirefox)
    }
  })

  it('a gecko fork never falls through to an empty family', () => {
    for (const browser of ['waterfox', 'librewolf', 'zen', 'floorp']) {
      const result = filterKeysForThisBrowser(manifest, browser)
      expect(result.browser_specific_settings).toBeDefined()
      expect(Object.keys(result).length).toBeGreaterThan(0)
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

type NestedScripts = {content_scripts: Array<{js?: string[]}>}

const storeKey = {
  manifest_version: 3,
  name: 'Lyrics',
  'chrome:key': 'MIIBIjANBgkq'
}

describe('filterKeysForThisBrowser vendor-exact chrome: and edge:', () => {
  it('keeps a chrome:key on chrome and drops it on edge', () => {
    const onChrome = filterKeysForThisBrowser(storeKey, 'chrome')
    const onEdge = filterKeysForThisBrowser(storeKey, 'edge')

    expect(onChrome.key).toBe('MIIBIjANBgkq')
    expect(onEdge.key).toBeUndefined()
    expect(onEdge['chrome:key']).toBeUndefined()
  })

  it('keeps an edge: key on edge only', () => {
    const edgeOnly = {'edge:short_name': 'EdgeOnly'}
    const others = ['chrome', 'chromium', 'chromium-based', 'brave', 'safari']
    const onEdge = filterKeysForThisBrowser(edgeOnly, 'edge')

    expect(onEdge.short_name).toBe('EdgeOnly')

    for (const browser of others) {
      const result = filterKeysForThisBrowser(edgeOnly, browser)

      expect(result.short_name).toBeUndefined()
    }
  })

  it('reaches no fork, chromium target, safari or gecko build', () => {
    const targets = [
      'brave',
      'opera',
      'vivaldi',
      'yandex',
      'chromium',
      'chromium-based',
      'safari',
      'webkit-based',
      'firefox',
      'gecko-based'
    ]

    for (const browser of targets) {
      const result = filterKeysForThisBrowser(storeKey, browser)

      expect(result.key).toBeUndefined()
    }
  })
})

describe('filterKeysForThisBrowser vendor keys in nested objects', () => {
  it('resolves the family key in a nested object on edge', () => {
    const nested = {
      content_scripts: [{'chrome:js': ['a.js'], 'chromium:js': ['b.js']}]
    }

    const onEdge = filterKeysForThisBrowser(nested, 'edge') as NestedScripts

    expect(onEdge.content_scripts[0].js).toEqual(['b.js'])
  })

  it('lets a fork keep its own name prefix', () => {
    const fork = {'brave:short_name': 'Brave', 'chromium:short_name': 'Fam'}

    expect(filterKeysForThisBrowser(fork, 'brave').short_name).toBe('Brave')
    expect(filterKeysForThisBrowser(fork, 'opera').short_name).toBe('Fam')
  })

  it('gives safari chromium: and webkit: keys, not chrome: or edge:', () => {
    const mixed = {
      'chromium:permissions': ['storage'],
      'chrome:short_name': 'Chrome',
      'edge:description': 'Edge',
      'webkit:homepage_url': 'https://example.com'
    }

    const result = filterKeysForThisBrowser(mixed, 'safari')

    expect(result.permissions).toEqual(['storage'])
    expect(result.short_name).toBeUndefined()
    expect(result.description).toBeUndefined()
    expect(result.homepage_url).toBe('https://example.com')
  })
})

describe('filterKeysForThisBrowser precedence per target', () => {
  it('treats chromium: as the most specific prefix on chromium', () => {
    const chromium = {
      short_name: 'Plain',
      'chromium:short_name': 'Chromium',
      'chrome:short_name': 'Chrome'
    }

    const withBrave = {
      'chromium:short_name': 'Chromium',
      'brave:short_name': 'Brave'
    }

    const plain = filterKeysForThisBrowser(chromium, 'chromium')
    const fork = filterKeysForThisBrowser(withBrave, 'chromium')

    expect(plain.short_name).toBe('Chromium')
    expect(fork.short_name).toBe('Chromium')
  })

  it('orders vendor over family over plain whatever the order', () => {
    const [plain, family, vendor]: Array<[string, string]> = [
      ['short_name', 'Plain'],
      ['chromium:short_name', 'Fam'],
      ['edge:short_name', 'Edge']
    ]

    const orders = [
      [plain, family, vendor],
      [vendor, family, plain],
      [family, plain, vendor],
      [vendor, plain, family]
    ]

    for (const order of orders) {
      const shuffled = Object.fromEntries(order)

      expect(filterKeysForThisBrowser(shuffled, 'edge').short_name).toBe('Edge')
      expect(filterKeysForThisBrowser(shuffled, 'chrome').short_name).toBe('Fam')
      expect(filterKeysForThisBrowser(shuffled, 'safari').short_name).toBe('Fam')
    }
  })
})

describe('filterKeysForThisBrowser gecko prefixes', () => {
  it('leaves the gecko prefixes as they were', () => {
    const gecko = {'gecko:short_name': 'Fam', 'firefox:description': 'Fx'}
    const onWaterfox = filterKeysForThisBrowser(gecko, 'waterfox')

    expect(onWaterfox.short_name).toBe('Fam')
    expect(onWaterfox.description).toBe('Fx')
    expect(filterKeysForThisBrowser(gecko, 'firefox').description).toBe('Fx')
  })
})

const ownValue = (target: object, key: string): unknown =>
  Object.getOwnPropertyDescriptor(target, key)?.value

describe('filterKeysForThisBrowser own properties', () => {
  it('keeps a plain __proto__ key as an own property', () => {
    const withProto = JSON.parse('{"name":"x","__proto__":{"polluted":true}}')
    const result = filterKeysForThisBrowser(withProto, 'firefox')

    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(true)
    expect(ownValue(result, '__proto__')).toEqual({polluted: true})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect((result as {polluted?: boolean}).polluted).toBeUndefined()
  })

  it('resolves a prefixed __proto__ key by precedence', () => {
    const prefixed = JSON.parse(
      '{"__proto__":{"plain":true},"chromium:__proto__":{"family":true}}'
    )

    const onChrome = filterKeysForThisBrowser(prefixed, 'chrome')
    const onFirefox = filterKeysForThisBrowser(prefixed, 'firefox')

    expect(ownValue(onChrome, '__proto__')).toEqual({family: true})
    expect(ownValue(onFirefox, '__proto__')).toEqual({plain: true})
    expect(Object.getPrototypeOf(onChrome)).toBe(Object.prototype)
  })

  it('keeps __proto__ own inside nested objects', () => {
    const nested = JSON.parse('{"background":{"__proto__":{"deep":true}}}')
    const result = filterKeysForThisBrowser(nested, 'edge')
    const background = result.background as object

    expect(ownValue(background, '__proto__')).toEqual({deep: true})
    expect(Object.getPrototypeOf(background)).toBe(Object.prototype)
  })
})
