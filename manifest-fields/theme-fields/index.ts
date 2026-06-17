import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>

export type ThemeFields = Record<string, string> | undefined

/**
 * Extract path-bearing theme image entries from manifest.theme.images.
 * Keys are normalized as "theme/images/<basename>" and values are resolved
 * from the manifest directory context, matching conventions used by other groups.
 */
export function themeFields (context: string, manifest: Manifest): ThemeFields {
  const images = manifest?.theme?.images

  if (!images || typeof images !== 'object') return undefined

  const out: Record<string, string> = {}

  for (const [_, value] of Object.entries(images)) {
    if (typeof value !== 'string' || !value) continue

    const resolved = resolveManifestPath(context, value)
    const basename = require('path').basename(value)

    out[`theme/images/${basename}`] = resolved
  }

  return Object.keys(out).length ? out : undefined
}
