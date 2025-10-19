import {describe, it, expect} from 'vitest'
import * as path from 'path'
import {iconFields} from '../../manifest-fields/icons-fields'
import {action} from '../../manifest-fields/icons-fields/action'
import {browserAction} from '../../manifest-fields/icons-fields/browser_action'
import {browserActionThemeIcons} from '../../manifest-fields/icons-fields/browser_action.theme_icons'
import {icons} from '../../manifest-fields/icons-fields/icons'
import {pageAction} from '../../manifest-fields/icons-fields/page_action'
import {sidebarAction} from '../../manifest-fields/icons-fields/sidebar_action'

const ctx = '/tmp/project'

describe('icons field resolvers', () => {
  it('resolves action default_icon string and object', () => {
    const m1: any = {action: {default_icon: 'public/a.png'}}
    expect(action(ctx, m1)).toBe(path.join(ctx, 'public/a.png'))
    const m2: any = {
      action: {default_icon: {16: 'public/16.png', 32: '/public/32.png'}}
    }
    expect(action(ctx, m2)).toEqual([
      path.join(ctx, 'public/16.png'),
      path.join(ctx, 'public/32.png')
    ])
  })

  it('resolves browser_action default_icon string and object', () => {
    const m1: any = {browser_action: {default_icon: 'public/a.png'}}
    expect(browserAction(ctx, m1)).toBe(path.join(ctx, 'public/a.png'))
    const m2: any = {
      browser_action: {
        default_icon: {16: 'public/16.png', 32: '/public/32.png'}
      }
    }
    expect(browserAction(ctx, m2)).toEqual([
      path.join(ctx, 'public/16.png'),
      path.join(ctx, 'public/32.png')
    ])
  })

  it('converts theme icons and removes size', () => {
    const m: any = {
      browser_action: {
        theme_icons: [
          {light: 'public/l.png', dark: 'public/d.png', size: 16},
          {light: '/public/l2.png'}
        ]
      }
    }
    const res = browserActionThemeIcons(ctx, m)!
    expect(res[0].light).toBe(path.join(ctx, 'public/l.png'))
    expect(res[0].dark).toBe(path.join(ctx, 'public/d.png'))
    // @ts-expect-error removed at runtime
    expect(res[0].size).toBeUndefined()
    expect(res[1].light).toBe(path.join(ctx, 'public/l2.png'))
  })

  it('maps icons object to list of absolute paths', () => {
    const m: any = {icons: {16: 'public/16.png', 32: '/public/32.png'}}
    expect(icons(ctx, m)).toEqual([
      path.join(ctx, 'public/16.png'),
      path.join(ctx, 'public/32.png')
    ])
  })

  it('sidebar/page action default icons', () => {
    const m1: any = {page_action: {default_icon: 'public/p.png'}}
    expect(pageAction(ctx, m1)).toBe(path.join(ctx, 'public/p.png'))
    const m2: any = {sidebar_action: {default_icon: 'public/s.png'}}
    expect(sidebarAction(ctx, m2)).toBe(path.join(ctx, 'public/s.png'))
  })

  it('iconFields aggregator returns combined map', () => {
    const m: any = {
      action: {default_icon: 'a.png'},
      browser_action: {default_icon: {16: '16.png'}},
      icons: {32: '32.png'},
      page_action: {default_icon: 'p.png'},
      sidebar_action: {default_icon: 's.png'}
    }
    const map = iconFields(ctx, m)
    expect(map.action).toBe(path.join(ctx, 'a.png'))
    expect(map.browser_action).toEqual([path.join(ctx, '16.png')])
    expect(map.icons).toEqual([path.join(ctx, '32.png')])
    expect(map.page_action).toBe(path.join(ctx, 'p.png'))
    expect(map.sidebar_action).toBe(path.join(ctx, 's.png'))
  })
})
