import { resolveManifestPath } from "../normalize";
type Manifest = Record<string, any>;

export function sidebarAction(
  context: string,
  manifest: Manifest,
): string | string[] | undefined {
  if (
    !manifest ||
    !manifest.sidebar_action ||
    !manifest.sidebar_action.default_icon
  ) {
    return undefined;
  }

  if (typeof manifest.sidebar_action.default_icon === "string") {
    return resolveManifestPath(
      context,
      manifest.sidebar_action.default_icon as string,
    );
  }

  const sidebarActionDefaultIcons: string[] = [];

  for (const icon in manifest.sidebar_action.default_icon) {
    const sidebarActionDefaultIconAbsolutePath = resolveManifestPath(
      context,
      manifest.sidebar_action.default_icon[icon] as string,
    );

    sidebarActionDefaultIcons.push(sidebarActionDefaultIconAbsolutePath);
  }

  return sidebarActionDefaultIcons;
}
