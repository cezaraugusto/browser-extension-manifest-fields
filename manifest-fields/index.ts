import * as path from 'path'
import * as fs from 'fs'
import {htmlFields} from './html-fields'
import {iconFields} from './icons-fields'
import {jsonFields} from './json-fields'
import {localesFields} from './locales-fields'
import {scriptsFields} from './scripts-fields'
import {webResourcesFields} from './web-resources-fields'
import {themeFields, type ThemeFields} from './theme-fields'
import {semanticFields, type SemanticFields} from './semantic-fields'
import {filterKeysForThisBrowser} from '../internal/utils'

// TODO: cezaraugusto type this
export interface ManifestFields {
  html: Record<string, any>
  icons: Record<string, any>
  json: Record<string, any>
  locales?: string[] | undefined
  scripts: Record<string, any>
  web_accessible_resources?: Array<string | Record<string, any>> | undefined
  theme?: ThemeFields
  semantic?: SemanticFields
}

export function getManifestFieldsData({
  manifestPath,
  browser
}: {
  manifestPath: string
  browser?: string
}) {
  const context = path.dirname(manifestPath)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const manifestNoPrefixes = filterKeysForThisBrowser(
    manifest,
    browser || 'chrome'
  )

  const fieldData = {
    html: htmlFields(context, manifestNoPrefixes),
    icons: iconFields(context, manifestNoPrefixes),
    json: jsonFields(context, manifestNoPrefixes),
    locales: localesFields(context, manifestPath),
    scripts: scriptsFields(context, manifestNoPrefixes),
    web_accessible_resources: webResourcesFields(manifestNoPrefixes),
    theme: themeFields(context, manifestNoPrefixes),
    semantic: semanticFields(manifestNoPrefixes)
  }
  return fieldData
}
