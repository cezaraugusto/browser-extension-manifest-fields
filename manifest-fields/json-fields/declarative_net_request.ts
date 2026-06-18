import * as path from 'path'

import {resolveManifestPath} from '../normalize'

type Manifest = Record<string, any>

export function declarativeNetRequest (
  context: string,
  manifest: Manifest
): Record<string, string | undefined> {
  const ruleResources: Record<string, string> = {}

  if (
    !manifest ||
    !manifest.declarative_net_request ||
    !manifest.declarative_net_request.rule_resources
  ) {
    return {'declarative_net_request/rule_resources-0': undefined}
  }

  const declarativeNetRequest = manifest.declarative_net_request.rule_resources

  // `rule_resources` is spec'd as an array; guard so a malformed (non-array)
  // value is ignored instead of throwing `.forEach is not a function`.
  if (!Array.isArray(declarativeNetRequest)) {
    return {'declarative_net_request/rule_resources-0': undefined}
  }

  declarativeNetRequest.forEach((resource: {id: string; path: string}) => {
    ruleResources[`declarative_net_request/${resource.id}`] =
      resolveManifestPath(context, resource.path)
  })

  return ruleResources
}
