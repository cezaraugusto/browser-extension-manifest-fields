import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function optionsUi(
  context: string,

  manifest: Manifest
): string | undefined {
  if (manifest.options_page) {
    const optionsPage: string = manifest.options_page

    return resolveManifestPath(context, optionsPage)
  }

  if (!manifest || !manifest.options_ui || !manifest.options_ui.page) {
    return undefined
  }

  const optionsPage: string = manifest.options_ui.page

  return resolveManifestPath(context, optionsPage)
}
