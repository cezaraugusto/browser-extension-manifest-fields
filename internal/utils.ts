export function filterKeysForThisBrowser(manifest: any, browser: string) {
  const normalizedBrowser = String(browser || '').toLowerCase()
  const isChromiumBrowser = /^(chrome|chromium|edge|opera|brave)$/.test(
    normalizedBrowser
  )
  const isGeckoBrowser = /^(firefox|gecko)$/.test(normalizedBrowser)
  return JSON.parse(
    JSON.stringify(manifest),
    function reviver(this: any, key: string, value: any) {
      const indexOfColon = key.indexOf(':')
      if (indexOfColon === -1) return value
      const prefix = key.substring(0, indexOfColon)

      if (
        prefix === normalizedBrowser ||
        (prefix === 'chromium' && isChromiumBrowser) ||
        (prefix === 'gecko' && isGeckoBrowser)
      ) {
        this[key.substring(indexOfColon + 1)] = value
      }
    }
  )
}
