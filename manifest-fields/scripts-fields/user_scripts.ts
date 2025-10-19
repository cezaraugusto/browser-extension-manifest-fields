import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function userScripts(
  context: string,
  manifest: Manifest
): string | undefined {
  if (
    !manifest ||
    !manifest.user_scripts ||
    !manifest.user_scripts.api_script
  ) {
    return undefined
  }

  const userScript: string = manifest.user_scripts.api_script

  return resolveManifestPath(context, userScript)
}
