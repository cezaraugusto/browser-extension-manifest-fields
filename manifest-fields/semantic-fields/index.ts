type Manifest = Record<string, any>

export type SemanticFields =
  | {
      permissions?: string[]
      optional_permissions?: string[]
      host_permissions?: string[]
      csp?:
        | {mv: 2; value?: string}
        | {
            mv: 3
            extension_pages?: string
            sandbox?: string
            raw?: Record<string, any>
          }
      externally_connectable?: Record<string, any>
      gecko_id?: string
    }
  | undefined

export function semanticFields(manifest: Manifest): SemanticFields {
  if (!manifest || typeof manifest !== 'object') return

  const out: NonNullable<SemanticFields> = {}

  if (Array.isArray(manifest.permissions) && manifest.permissions.length) {
    out.permissions = [...manifest.permissions]
  }
  if (
    Array.isArray(manifest.optional_permissions) &&
    manifest.optional_permissions.length
  ) {
    out.optional_permissions = [...manifest.optional_permissions]
  }
  if (
    Array.isArray(manifest.host_permissions) &&
    manifest.host_permissions.length
  ) {
    out.host_permissions = [...manifest.host_permissions]
  }

  if (manifest.manifest_version === 2) {
    if (typeof manifest.content_security_policy === 'string') {
      out.csp = {mv: 2, value: manifest.content_security_policy}
    }
  } else if (manifest.manifest_version === 3) {
    const csp = manifest.content_security_policy
    if (csp && typeof csp === 'object') {
      out.csp = {
        mv: 3,
        extension_pages: csp.extension_pages,
        sandbox: csp.sandbox,
        raw: csp
      }
    }
  }

  if (
    manifest.externally_connectable &&
    typeof manifest.externally_connectable === 'object'
  ) {
    out.externally_connectable = manifest.externally_connectable
  }

  const geckoId =
    manifest.browser_specific_settings &&
    manifest.browser_specific_settings.gecko &&
    manifest.browser_specific_settings.gecko.id
  if (typeof geckoId === 'string' && geckoId) {
    out.gecko_id = geckoId
  }

  const hasAny =
    (out.permissions && out.permissions.length) ||
    (out.optional_permissions && out.optional_permissions.length) ||
    (out.host_permissions && out.host_permissions.length) ||
    out.csp ||
    out.externally_connectable ||
    out.gecko_id

  return hasAny ? out : undefined
}
