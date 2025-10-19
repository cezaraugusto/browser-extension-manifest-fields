import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function icons(
  context: string,
  manifest: Manifest
): string[] | undefined {
  if (!manifest || !manifest.icons) return undefined

  const defaultIcons: string[] = []
  for (const icon in manifest.icons) {
    const iconAbsolutePath = resolveManifestPath(context, manifest.icons[icon])

    defaultIcons.push(iconAbsolutePath)
  }

  return defaultIcons
}
