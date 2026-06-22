[npm-version-image]: https://img.shields.io/npm/v/browser-extension-manifest-fields.svg?color=0971fe
[npm-version-url]: https://www.npmjs.com/package/browser-extension-manifest-fields
[npm-downloads-image]: https://img.shields.io/npm/dm/browser-extension-manifest-fields.svg?color=2ecc40
[npm-downloads-url]: https://www.npmjs.com/package/browser-extension-manifest-fields
[action-image]: https://github.com/cezaraugusto/browser-extension-manifest-fields/actions/workflows/ci.yml/badge.svg?branch=main
[action-url]: https://github.com/cezaraugusto/browser-extension-manifest-fields/actions

> Parse and resolve browser extension manifest fields to absolute paths.

# browser-extension-manifest-fields [![Version][npm-version-image]][npm-version-url] [![Downloads][npm-downloads-image]][npm-downloads-url] [![workflow][action-image]][action-url]

Parse a `manifest.json` and resolve file paths for HTML, icons, JSON, scripts, locales, and web-accessible resources. It also surfaces theme image paths and semantic fields used for restart-required decisions.

## Installation

```bash
npm i browser-extension-manifest-fields
```

## What it does

- HTML, icons, JSON, and scripts declared in the manifest are resolved to absolute file system paths, with public-root inputs normalized (e.g., `/something`, `/public/something`, `public/something`).
- Browser-prefixed manifest keys are honored using the current target browser (e.g., `chromium:action` for Chrome vs `gecko:action` for Firefox/Gecko).
- `content_scripts` entries include both JS and CSS assets when present, preserving ordering.
- `web_accessible_resources` are passed through as-is for MV3, or strings for MV2.
- Locales under `_locales/*` are discovered if present.
- In development, manifest data cooperates with the reload pipeline: CSP and permissions are patched, and minimal background entries are ensured so the reloader can be injected.

## Usage

```ts
import { getManifestFieldsData } from "browser-extension-manifest-fields";

// Resolve manifest field paths
const fields = getManifestFieldsData({
  manifestPath: "/abs/path/to/manifest.json",
});
```

Sample output:

```json
{
  "html": {
    "action/index": "/abs/path/to/public/chrome-popup.html",
    "options/index": "/abs/path/to/public/options.html"
  },
  "icons": {
    "action": "/abs/path/to/icons/action.png",
    "icons": ["/abs/path/to/icons/16.png", "/abs/path/to/icons/48.png"]
  },
  "json": {
    "declarative_net_request": [
      {
        "id": "rules",
        "enabled": true,
        "path": "/abs/path/to/rules/rules_1.json"
      }
    ]
  },
  "scripts": {
    "background/service_worker": "/abs/path/to/src/background.js",
    "content_scripts/content-0": [
      "/abs/path/to/src/content.js",
      "/abs/path/to/src/content.css"
    ]
  },
  "web_accessible_resources": [
    {
      "resources": ["/abs/path/to/assets/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "theme": {
    "theme/images/frame.png": "/abs/path/to/public/theme/frame.png"
  },
  "semantic": {
    "permissions": ["storage"],
    "host_permissions": ["https://*/*"],
    "csp": {"mv": 3, "extension_pages": "script-src 'self'"}
  }
}
```

## API

```ts
// manifest-fields
export interface ManifestFields {
  html: Record<string, any>
  icons: Record<string, any>
  json: Record<string, any>
  locales?: string[] | undefined
  scripts: Record<string, any>
  web_accessible_resources?: Array<string | Record<string, any>> | undefined
  theme?: Record<string, string> | undefined
  semantic?:
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
}

export function getManifestFieldsData(args: {
  manifestPath: string;
  browser?: string;
}): ManifestFields;
```

### Special folders helper

```ts
import {getSpecialFoldersData} from 'browser-extension-manifest-fields'

// Discovers assets under public/, html pages/ and script entries
const entries = getSpecialFoldersData({manifestPath: '/abs/path/manifest.json'})
// entries: {
//   public: Record<string, string>
//   pages: Record<string, string>
//   scripts: Record<string, string>
// }
```

### Publish provenance helper

```ts
import {getProvenanceData} from 'browser-extension-manifest-fields'

const prov = getProvenanceData({manifestPath: '/abs/path/manifest.json'})
// prov.enabled is true when package.json has publishConfig.provenance=true and
// CI workflows request id-token: write and use `--provenance` on publish.
// You can inspect prov.workflows for details.
```

## Path resolution conventions

- Relative paths resolve from the manifest directory.
- Leading `/` resolves from the extension root (package root), not the OS root.
- OS-absolute filesystem paths are not part of the browser extension spec; prefer relative or `/public/...` references instead.

## Related projects

* [browser-extension-capabilities](https://github.com/cezaraugusto/browser-extension-capabilities)
* [browser-extension-compat-data](https://github.com/cezaraugusto/browser-extension-compat-data)
* [extension-from-store](https://github.com/cezaraugusto/extension-from-store)
* [chrome-extension-manifest-json-schema](https://github.com/cezaraugusto/chrome-extension-manifest-json-schema)
* [parse5-asset-patcher](https://github.com/cezaraugusto/parse5-asset-patcher)

## License

MIT (c) Cezar Augusto.
