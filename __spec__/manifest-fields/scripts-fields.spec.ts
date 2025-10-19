import {describe, it, expect} from 'vitest'
import * as path from 'path'
import {scriptsFields} from '../../manifest-fields/scripts-fields'
import {backgroundScripts} from '../../manifest-fields/scripts-fields/background'
import {contentScripts} from '../../manifest-fields/scripts-fields/content_scripts'
import {serviceWorker} from '../../manifest-fields/scripts-fields/service_worker'
import {userScripts} from '../../manifest-fields/scripts-fields/user_scripts'

describe('scripts field resolvers', () => {
  const ctx = '/tmp/project'

  it('background scripts list absolute paths', () => {
    const m: any = {background: {scripts: ['public/a.js', '/public/b.js']}}
    expect(backgroundScripts(ctx, m)).toEqual([
      path.join(ctx, 'public/a.js'),
      path.join(ctx, 'public/b.js')
    ])
  })

  it('service worker resolves to absolute path', () => {
    const m: any = {background: {service_worker: 'sw.js'}}
    expect(serviceWorker(ctx, m)).toBe(path.join(ctx, 'sw.js'))
  })

  it('content scripts combine js then css preserving order', () => {
    const m: any = {
      content_scripts: [
        {js: ['a.js', 'b.js'], css: ['c.css']},
        {js: [], css: []}
      ]
    }
    const res = contentScripts(ctx, m)
    expect(res['content_scripts/content-0']).toEqual([
      path.join(ctx, 'a.js'),
      path.join(ctx, 'b.js'),
      path.join(ctx, 'c.css')
    ])
    expect(res['content_scripts/content-1']).toEqual([])
  })

  it('user scripts resolves api_script', () => {
    const m: any = {user_scripts: {api_script: 'api.js'}}
    expect(userScripts(ctx, m)).toBe(path.join(ctx, 'api.js'))
  })

  it('scriptsFields aggregator returns combined map', () => {
    const m: any = {
      background: {scripts: ['a.js'], service_worker: 'sw.js'},
      content_scripts: [{js: ['a.js'], css: ['a.css']}],
      user_scripts: {api_script: 'u.js'}
    }
    const map = scriptsFields(ctx, m)
    expect(map['background/scripts']).toEqual([path.join(ctx, 'a.js')])
    expect(map['background/service_worker']).toBe(path.join(ctx, 'sw.js'))
    expect(map['content_scripts/content-0']).toEqual([
      path.join(ctx, 'a.js'),
      path.join(ctx, 'a.css')
    ])
    expect(map['user_scripts/api_script']).toBe(path.join(ctx, 'u.js'))
  })
})
