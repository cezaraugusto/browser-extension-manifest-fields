type Manifest = Record<string, any>

export type BrowserTarget =
  | 'chrome' |
  'edge' |
  'brave' |
  'opera' |
  'vivaldi' |
  'yandex' |
  'firefox' |
  'waterfox' |
  'librewolf' |
  'zen' |
  'floorp' |
  'chromium' |
  'chromium-based' |
  'gecko-based' |
  'firefox-based' |
  'safari' |
  'webkit-based' |
  (string & {})

// Engine-family classification. Fork browsers inherit their family's
// chromium:/gecko:/firefox: scoped manifest keys; the generic
// '*-based'/'chromium'/'gecko' aliases are matched by substring below.
const CHROMIUM_BASED_BROWSERS = ['chrome', 'edge', 'brave', 'opera', 'vivaldi', 'yandex']
const GECKO_BASED_BROWSERS = ['firefox', 'waterfox', 'librewolf', 'zen', 'floorp']

export function filterKeysForThisBrowser (
  manifest: Manifest,
  browser: BrowserTarget
): Manifest {
  // Safari/webkit are not chromium-based for launch classification, but for
  // MANIFEST keys they inherit the chromium family or prefixed keys resolve
  // to nothing.
  const isSafariTarget =
    browser === 'safari' ||
    browser === 'webkit-based' ||
    String(browser).includes('webkit')

  const isChromiumTarget =
    CHROMIUM_BASED_BROWSERS.includes(browser) ||
    String(browser).includes('chromium') ||
    isSafariTarget

  const isGeckoTarget =
    GECKO_BASED_BROWSERS.includes(browser) ||
    String(browser).includes('gecko') ||
    String(browser).includes('firefox')

  // chromium: is the only Chromium family prefix. chrome: and edge: name one
  // vendor and match through `prefix === browser` alone, so a Chrome Web Store
  // `chrome:key` never reaches an Edge build.
  const chromiumPrefixes = new Set(['chromium'])
  const geckoPrefixes = new Set(['gecko', 'firefox'])
  // safari:/webkit: keys are the most specific ones a safari target has, and
  // must win over the chromium-family keys it also inherits. Matching them
  // only through `prefix === browser` dropped `webkit:` on a `safari` build
  // entirely, so the key vanished instead of resolving.
  const webkitPrefixes = new Set(['safari', 'webkit'])

  const isFamilyPrefix = (prefix: string): boolean =>
    (isChromiumTarget && chromiumPrefixes.has(prefix)) ||
    (isGeckoTarget && geckoPrefixes.has(prefix))

  const isSpecificPrefix = (prefix: string): boolean =>
    prefix === browser || (isSafariTarget && webkitPrefixes.has(prefix))

  // A JSON.parse reviver assigns as it walks, so two matching prefixes for one
  // key resolved in SOURCE ORDER and the last one in the file won: `chrome:`
  // beat `chromium:` or lost to it depending only on where it sat. Collect the
  // candidates per object instead and apply a fixed precedence. Two sibling
  // family prefixes (gecko: and firefox: on waterfox) keep source order.
  const resolve = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map((item) => resolve(item))

    if (node && typeof node === 'object') {
      // Maps, not plain objects: a manifest key named __proto__ assigned on
      // a plain object sets its prototype instead of a key and vanishes.
      const result = new Map<string, unknown>()
      const familyMatches = new Map<string, unknown>()
      const specificMatches = new Map<string, unknown>()

      for (const [key, value] of Object.entries(node)) {
        const indexOfColon = key.indexOf(':')

        if (indexOfColon === -1) {
          result.set(key, resolve(value))
          continue
        }

        const prefix = key.substring(0, indexOfColon)
        const strippedKey = key.substring(indexOfColon + 1)

        if (isSpecificPrefix(prefix)) {
          specificMatches.set(strippedKey, resolve(value))
        } else if (isFamilyPrefix(prefix)) {
          familyMatches.set(strippedKey, resolve(value))
        }
      }

      // Precedence (deterministic): plain < family prefix < specific prefix.
      for (const [strippedKey, value] of familyMatches) {
        result.set(strippedKey, value)
      }
      for (const [strippedKey, value] of specificMatches) {
        result.set(strippedKey, value)
      }

      // fromEntries defines own data properties, so __proto__ stays a key.
      return Object.fromEntries(result)
    }

    return node
  }

  return resolve(manifest) as Manifest
}
