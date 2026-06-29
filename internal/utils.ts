import {filterKeysForThisBrowser as resolvePrefixedKeys} from '../browser-prefix-fields'

export function filterKeysForThisBrowser (manifest: any, browser: string) {
  return resolvePrefixedKeys(manifest, browser)
}
