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
  'chromium' |
  'chromium-based' |
  'gecko-based' |
  'firefox-based' |
  'safari' |
  'webkit-based' |
  (string & {})

// Engine-family classification. Fork browsers inherit their family's
// chrome:/firefox: scoped manifest keys; the generic '*-based'/'chromium'/
// 'gecko' aliases are matched by substring below.
const CHROMIUM_BASED_BROWSERS = ['chrome', 'edge', 'brave', 'opera', 'vivaldi', 'yandex']
const GECKO_BASED_BROWSERS = ['firefox', 'waterfox', 'librewolf']

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

  const chromiumPrefixes = new Set(['chromium', 'chrome', 'edge'])
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
  // candidates per object instead and apply a fixed precedence.
  const resolve = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map((item) => resolve(item))

    if (node && typeof node === 'object') {
      const result: Record<string, unknown> = {}
      const familyMatches: Record<string, unknown> = {}
      const specificMatches: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(node)) {
        const indexOfColon = key.indexOf(':')

        if (indexOfColon === -1) {
          result[key] = resolve(value)
          continue
        }

        const prefix = key.substring(0, indexOfColon)
        const strippedKey = key.substring(indexOfColon + 1)

        if (isSpecificPrefix(prefix)) {
          specificMatches[strippedKey] = resolve(value)
        } else if (isFamilyPrefix(prefix)) {
          familyMatches[strippedKey] = resolve(value)
        }
      }

      // Precedence (deterministic): plain < family prefix < specific prefix.
      for (const [strippedKey, value] of Object.entries(familyMatches)) {
        result[strippedKey] = value
      }
      for (const [strippedKey, value] of Object.entries(specificMatches)) {
        result[strippedKey] = value
      }

      return result
    }

    return node
  }

  return resolve(manifest) as Manifest
}
