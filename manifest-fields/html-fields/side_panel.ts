import {resolveManifestPath} from '../normalize'
type Manifest = Record<string, any>

export function sidePanel(
  context: string,
  manifest: Manifest
): string | undefined {
  if (!manifest || !manifest.side_panel || !manifest.side_panel.default_path) {
    return undefined
  }

  const sidePanelPath = manifest.side_panel.default_path
  return resolveManifestPath(context, sidePanelPath)
}
