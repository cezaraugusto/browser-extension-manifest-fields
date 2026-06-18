import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>

export function chromeUrlOverrides (
  context: string,

  manifest: Manifest
): Record<string, Manifest | undefined> {
  if (!manifest || !manifest.chrome_url_overrides) {
    return {'chrome_url_overrides/newtab': undefined}
  }

  // An extension may override more than one of newtab/bookmarks/history at once
  // , they are independent keys. Accumulate every declared override instead of
  // reassigning the result, otherwise only the last-declared page survives and
  // the others never get built/emitted.
  const chromeUrlOverride: Record<string, any> = {}

  for (const page of ['history', 'newtab', 'bookmarks'] as const) {
    const value = manifest.chrome_url_overrides[page]

    if (value) {
      chromeUrlOverride[`chrome_url_overrides/${page}`] = resolveManifestPath(
        context,
        value as string
      )
    }
  }

  // Preserve the historical default key when nothing is declared so consumers
  // that look up `chrome_url_overrides/newtab` keep getting `undefined`.
  if (Object.keys(chromeUrlOverride).length === 0) {
    return {'chrome_url_overrides/newtab': undefined}
  }

  return chromeUrlOverride
}
