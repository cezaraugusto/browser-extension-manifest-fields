import {backgroundScripts} from './background'
import {serviceWorker} from './service_worker'
import {contentScripts} from './content_scripts'
import {userScripts} from './user_scripts'
type Manifest = Record<string, any>

export function scriptsFields(
  context: string,

  manifest: Manifest
): Record<string, string | string[] | undefined> {
  return {
    'background/scripts': backgroundScripts(context, manifest),
    'background/service_worker': serviceWorker(context, manifest),
    // read as: content_scripts/content-<index>: contentScripts(manifest),
    ...contentScripts(context, manifest),
    'user_scripts/api_script': userScripts(context, manifest)
  }
}
