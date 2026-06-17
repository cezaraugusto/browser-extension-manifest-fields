import {describe, it, expect} from 'vitest'

import {semanticFields} from '../../manifest-fields/semantic-fields'

describe('semanticFields', () => {
  it('returns undefined for empty manifest', () => {
    expect(semanticFields({})).toBeUndefined()
  })

  it('collects permissions and host permissions', () => {
    const out = semanticFields({
      permissions: ['storage'],
      host_permissions: ['https://*/*']
    })!

    expect(out.permissions).toEqual(['storage'])
    expect(out.host_permissions).toEqual(['https://*/*'])
  })

  it('handles MV2 CSP string', () => {
    const out = semanticFields({
      manifest_version: 2,
      content_security_policy:
        "script-src 'self' 'unsafe-eval'; object-src 'self'"
    })!

    expect(out.csp).toEqual({
      mv: 2,
      value: "script-src 'self' 'unsafe-eval'; object-src 'self'"
    })
  })

  it('handles MV3 CSP object', () => {
    const out = semanticFields({
      manifest_version: 3,
      content_security_policy: {
        extension_pages: "script-src 'self'",
        sandbox: "sandbox-src 'self'"
      }
    })!

    expect(out.csp?.mv).toBe(3)
    expect(out.csp?.extension_pages).toBe("script-src 'self'")
    expect(out.csp?.sandbox).toBe("sandbox-src 'self'")
  })

  it('captures externally_connectable and gecko id', () => {
    const out = semanticFields({
      externally_connectable: {ids: ['*']},
      browser_specific_settings: {gecko: {id: 'my-ext@example.org'}}
    })!

    expect(out.externally_connectable).toEqual({ids: ['*']})
    expect(out.gecko_id).toBe('my-ext@example.org')
  })
})
