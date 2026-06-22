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

  const addImage = (value: unknown): void => {
    if (typeof value !== 'string' || !value) return

    const resolved = resolveManifestPath(context, value)
    const basename = require('path').basename(value)

    out[`theme/images/${basename}`] = resolved
  }

  for (const [_, value] of Object.entries(images)) {
    // `theme.images` values are usually a single path string (e.g.
    // `theme_frame`), but `additional_backgrounds` is an array of paths; a
    // theme can layer multiple backgrounds. Collect every entry so each
    // background image is emitted, not just single-string fields.
    if (Array.isArray(value)) {
      for (const entry of value) addImage(entry)
    } else {
      addImage(value)
    }
  }

  return Object.keys(out).length ? out : undefined
}
