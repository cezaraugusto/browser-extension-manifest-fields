import {declarativeNetRequest} from './declarative_net_request'
import {storage} from './storage'
type Manifest = Record<string, any>

export function jsonFields(
  context: string,
  manifest: Manifest
): Record<string, string | undefined> {
  return {
    // read as: declarativeNetRequest/<id>: declarativeNetRequest(manifestPath, manifest),
    ...declarativeNetRequest(context, manifest),
    'storage/managed_schema': storage(context, manifest)
  }
}
