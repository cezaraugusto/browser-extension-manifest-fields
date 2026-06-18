import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>

export function backgroundScripts (
  context: string,
  manifest: Manifest
): string[] | undefined {
  if (!manifest || !manifest.background) {
    return undefined
  }

  const {scripts} = manifest.background

  // `background.scripts` is spec'd as an array; guard so a malformed
  // (non-array) value is ignored instead of throwing `.map is not a function`.
  if (Array.isArray(scripts)) {
    return scripts.map((script: string) => {
      return resolveManifestPath(context, script)
    })
  }

  return undefined
}
