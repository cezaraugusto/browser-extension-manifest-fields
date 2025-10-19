import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function devtoolsPage(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.devtools_page) {
    return undefined
  }

  const devtoolsPage: string = manifest.devtools_page
  return resolveManifestPath(context, devtoolsPage)
}
