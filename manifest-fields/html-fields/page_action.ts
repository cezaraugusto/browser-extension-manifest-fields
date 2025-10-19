import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function pageAction(
  context: string,
  manifest: Manifest
): string | undefined {
  if (
    !manifest ||
    !manifest.page_action ||
    !manifest.page_action.default_popup
  ) {
    return undefined
  }

  const pageActionPage: string = manifest.page_action.default_popup
  return resolveManifestPath(context, pageActionPage)
}
