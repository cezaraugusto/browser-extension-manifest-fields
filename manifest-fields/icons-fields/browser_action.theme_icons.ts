import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>
type ThemeIcon = {light?: string; dark?: string; size?: number}

export function browserActionThemeIcons (
  context: string,

  manifest: Manifest
): ThemeIcon[] | undefined {
  if (
    !manifest ||
    !manifest.browser_action ||
    // @ts-ignore
    !manifest.browser_action.theme_icons
  ) {
    return undefined
  }

  const themeIcons = manifest.browser_action.theme_icons

  if (!Array.isArray(themeIcons)) return undefined

  // Return resolved copies without mutating the manifest in place; `size` is
  // dropped from the output (same as before) but the input object is untouched.
  return (themeIcons as ThemeIcon[]).map((themeIcon) => {
    const resolved: ThemeIcon = {...themeIcon}

    if (resolved.light) {
      resolved.light = resolveManifestPath(context, resolved.light)
    }

    if (resolved.dark) {
      resolved.dark = resolveManifestPath(context, resolved.dark)
    }

    if (resolved.size !== undefined) delete resolved.size

    return resolved
  })
}
