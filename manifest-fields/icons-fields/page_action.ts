import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function pageAction(
  context: string,
  manifest: Manifest
): string | string[] | undefined {
  if (
    !manifest ||
    !manifest.page_action ||
    !manifest.page_action.default_icon
  ) {
    return undefined
  }

  if (typeof manifest.page_action.default_icon === 'string') {
    return resolveManifestPath(
      context,
      manifest.page_action.default_icon as string
    )
  }

  const pageActionDefaultIcons: string[] = []

  for (const icon in manifest.page_action.default_icon) {
    const pageactionDefaultIconAbsolutePath = resolveManifestPath(
      context,
      manifest.page_action.default_icon[icon] as string
    )

    pageActionDefaultIcons.push(pageactionDefaultIconAbsolutePath)
  }

  return pageActionDefaultIcons
}
