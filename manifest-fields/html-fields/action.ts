import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function action(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.action || !manifest.action.default_popup) {
    return undefined
  }

  const actionPage: string = manifest.action.default_popup

  return resolveManifestPath(context, actionPage)
}
