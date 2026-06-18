import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>

export function browserAction (
  context: string,

  manifest: Manifest
): string | string[] | undefined {
  if (
    !manifest ||
    !manifest.browser_action ||
    !manifest.browser_action.default_icon
  ) {
    return undefined
  }

  const browserActionDefaultIcons: string[] = []

  if (typeof manifest.browser_action.default_icon === 'string') {
    return resolveManifestPath(
      context,
      manifest.browser_action.default_icon as string
    )
  }

  // Resolve into a new array without mutating the manifest in place (the sibling
  // action/page_action/sidebar_action resolvers don't mutate either).
  for (const icon in manifest.browser_action.default_icon) {
    browserActionDefaultIcons.push(
      resolveManifestPath(
        context,
        manifest.browser_action.default_icon[icon] as string
      )
    )
  }

  return browserActionDefaultIcons
}
