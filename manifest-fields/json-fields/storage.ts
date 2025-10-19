import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function storage(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.storage || !manifest.storage.managed_schema) {
    return undefined
  }

  const storageManagedSchema: string = manifest.storage.managed_schema

  return resolveManifestPath(context, storageManagedSchema)
}
