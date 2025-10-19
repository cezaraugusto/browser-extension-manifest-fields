import {describe, it, expect} from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {htmlFields} from '../../manifest-fields/html-fields'
import {action} from '../../manifest-fields/html-fields/action'
import {background} from '../../manifest-fields/html-fields/background'
import {browserAction} from '../../manifest-fields/html-fields/browser_action'
import {chromeUrlOverrides} from '../../manifest-fields/html-fields/chrome_url_overrides'
import {devtoolsPage} from '../../manifest-fields/html-fields/devtools_page'
import {optionsUi} from '../../manifest-fields/html-fields/options_ui'
import {pageAction} from '../../manifest-fields/html-fields/page_action'
import {sandbox} from '../../manifest-fields/html-fields/sandbox'
import {sidePanel} from '../../manifest-fields/html-fields/side_panel'
import {sidebarAction} from '../../manifest-fields/html-fields/sidebar_action'

const makeTmp = () => {
  const tmp = path.join(__dirname, '.tmp-html')
  fs.mkdirSync(tmp, {recursive: true})
  return tmp
}

describe('html field resolvers', () => {
  const ctx = makeTmp()
  const manifest: any = {
    action: {default_popup: 'public/popup.html'},
    background: {page: '/public/bg.html'},
    browser_action: {default_popup: '/popup.html'},
    chrome_url_overrides: {
      newtab: '/public/newtab.html',
      bookmarks: 'public/bookmarks.html',
      history: 'public/history.html'
    },
    devtools_page: 'devtools/index.html',
    options_ui: {page: './public/options.html'},
    page_action: {default_popup: 'page.html'},
    sandbox: {pages: ['public/s1.html', '/public/s2.html']},
    side_panel: {default_path: 'public/side.html'},
    sidebar_action: {default_panel: 'public/sidebar.html'}
  }

  it('action/browser_action/page_action/background/devtools/options/side/sidepanel resolve to absolute paths', () => {
    expect(action(ctx, manifest)).toBe(path.join(ctx, 'public/popup.html'))
    expect(browserAction(ctx, manifest)).toBe(path.join(ctx, 'popup.html'))
    expect(pageAction(ctx, manifest)).toBe(path.join(ctx, 'page.html'))
    expect(background(ctx, manifest)).toBe(path.join(ctx, 'public/bg.html'))
    expect(devtoolsPage(ctx, manifest)).toBe(
      path.join(ctx, 'devtools/index.html')
    )
    expect(optionsUi(ctx, manifest)).toBe(path.join(ctx, 'public/options.html'))
    expect(sidePanel(ctx, manifest)).toBe(path.join(ctx, 'public/side.html'))
    expect(sidebarAction(ctx, manifest)).toBe(
      path.join(ctx, 'public/sidebar.html')
    )
  })

  it('chrome_url_overrides maps keys correctly (last key wins)', () => {
    const result = chromeUrlOverrides(ctx, manifest)
    // per implementation, the last processed property overwrites previous
    expect(Object.keys(result)[0]).toBe('chrome_url_overrides/bookmarks')
    expect(result['chrome_url_overrides/bookmarks']).toBe(
      path.join(ctx, 'public/bookmarks.html')
    )
  })

  it('sandbox lists each page index', () => {
    const result = sandbox(ctx, manifest)
    expect(result['sandbox/page-0']).toBe(path.join(ctx, 'public/s1.html'))
    expect(result['sandbox/page-1']).toBe(path.join(ctx, 'public/s2.html'))
  })

  it('htmlFields aggregator combines present values (sidebar prioritizes sidePanel when present)', () => {
    const result = htmlFields(ctx, manifest)
    expect(result['action/index']).toBe(path.join(ctx, 'public/popup.html'))
    expect(result['devtools/index']).toBe(path.join(ctx, 'devtools/index.html'))
    expect(result['options/index']).toBe(path.join(ctx, 'public/options.html'))
    expect(result['background/index']).toBe(path.join(ctx, 'public/bg.html'))
    expect(result['sandbox/page-0']).toBe(path.join(ctx, 'public/s1.html'))
    expect(result['sandbox/page-1']).toBe(path.join(ctx, 'public/s2.html'))
    // sidePanel takes precedence if both are present
    expect(result['sidebar/index']).toBe(path.join(ctx, 'public/side.html'))
  })

  it('returns undefined defaults when properties are missing', () => {
    const empty: any = {}
    expect(action(ctx, empty)).toBeUndefined()
    expect(browserAction(ctx, empty)).toBeUndefined()
    expect(pageAction(ctx, empty)).toBeUndefined()
    expect(background(ctx, empty)).toBeUndefined()
    expect(devtoolsPage(ctx, empty)).toBeUndefined()
    expect(optionsUi(ctx, empty)).toBeUndefined()
    expect(sidePanel(ctx, empty)).toBeUndefined()
    expect(sidebarAction(ctx, empty)).toBeUndefined()
    const chromeEmpty = chromeUrlOverrides(ctx, empty)
    expect(chromeEmpty['chrome_url_overrides/newtab']).toBeUndefined()
  })
})
