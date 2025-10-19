import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function serviceWorker(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.background) {
    return undefined
  }

  const serviceWorker = manifest.background.service_worker

  if (serviceWorker) {
    return resolveManifestPath(context, serviceWorker)
  }

  return undefined
}
