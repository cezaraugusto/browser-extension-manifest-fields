import * as fs from 'fs'
import * as path from 'path'

import {describe, it, expect} from 'vitest'

import {webResourcesFields} from '../../manifest-fields/web-resources-fields'
import {getManifestFieldsData} from '../../manifest-fields'

const makeManifest = (dir: string, json: any) => {
  fs.mkdirSync(dir, {recursive: true})
  const manifestPath = path.join(dir, 'manifest.json')

  fs.writeFileSync(manifestPath, JSON.stringify(json, null, 2), 'utf8')

  return manifestPath
}

describe('web accessible resources', () => {
  it('returns undefined when unset', () => {
    expect(webResourcesFields({} as any)).toBeUndefined()
    expect(
      webResourcesFields({web_accessible_resources: []} as any)
    ).toBeUndefined()
  })

  it('passes through mv3 resources', () => {
    const m: any = {
      web_accessible_resources: [
        {resources: ['a.js'], matches: ['<all_urls>']}
      ]
    }

    expect(webResourcesFields(m)).toEqual(m.web_accessible_resources)
  })
})

describe('getManifestFieldsData', () => {
  it('aggregates field data and respects browser-specific keys', () => {
    const tmp = path.join(__dirname, '.tmp-manifest')
    const manifest = {
      action: {default_popup: 'public/p.html'},
      icons: {16: 'public/16.png'},
      declarative_net_request: {
        rule_resources: [{id: 'r', path: 'rules.json'}]
      },
      // Browser-prefix keys: chromium:action should appear for chrome
      'chromium:action': {default_popup: 'public/c.html'},
      'gecko:action': {default_popup: 'public/fx.html'}
    }

    const manifestPath = makeManifest(tmp, manifest)
    const res = getManifestFieldsData({
      manifestPath,
      browser: 'chrome'
    } as any)

    // Html includes chromium:action path, not gecko:action
    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'public/c.html')
    )
  })
})

describe('getManifestFieldsData BOM tolerance', () => {
  it('parses a manifest with a UTF-8 BOM, as Chrome does', () => {
    const tmp = path.join(__dirname, '.tmp-manifest-bom')
    fs.mkdirSync(tmp, {recursive: true})
    const manifestPath = path.join(tmp, 'manifest.json')
    fs.writeFileSync(
      manifestPath,
      '﻿' + JSON.stringify({action: {default_popup: 'p.html'}}),
      'utf8'
    )

    const res = getManifestFieldsData({manifestPath, browser: 'chrome'} as any)
    expect(res.html['action/index']).toBe(
      path.join(path.dirname(manifestPath), 'p.html')
    )
  })
})
