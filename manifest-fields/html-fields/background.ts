import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function background(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.background || !manifest.background.page) {
    return undefined
  }

  const backgroundPage: string = manifest.background.page
  return resolveManifestPath(context, backgroundPage)
}
