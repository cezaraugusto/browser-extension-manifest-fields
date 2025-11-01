[empowering-image]: https://img.shields.io/badge/Empowering-Extension.js-0971fe
[empowering-url]: https://extension.js.org
[npm-version-image]: https://img.shields.io/npm/v/browser-extension-manifest-fields.svg?color=0971fe
[npm-version-url]: https://www.npmjs.com/package/browser-extension-manifest-fields
[npm-downloads-image]: https://img.shields.io/npm/dm/browser-extension-manifest-fields.svg?color=2ecc40
[npm-downloads-url]: https://www.npmjs.com/package/browser-extension-manifest-fields
[action-image]: https://github.com/cezaraugusto/browser-extension-manifest-fields/actions/workflows/ci.yml/badge.svg?branch=main
[action-url]: https://github.com/cezaraugusto/browser-extension-manifest-fields/actions

[![Empowering Extension.js][empowering-image]][empowering-url] [![Version][npm-version-image]][npm-version-url] [![Downloads][npm-downloads-image]][npm-downloads-url] [![workflow][action-image]][action-url]

# browser-extension-manifest-fields

> Parse and resolve browser extension manifest fields to absolute paths.

Parse a `manifest.json` and resolve file paths for HTML, icons, JSON, scripts, locales, and web accessible resources.

## What it does

- HTML, icons, JSON, and scripts declared in the manifest are resolved to absolute file system paths, with public-root inputs normalized (e.g., `/something`, `/public/something`, `public/something`).
- Browser-prefixed manifest keys are honored using the current target browser (e.g., `chromium:action` for Chrome vs `gecko:action` for Firefox/Gecko).
- `content_scripts` entries include both JS and CSS assets when present, preserving ordering.
- `web_accessible_resources` are passed through as-is for MV3, or strings for MV2.
- Locales under `_locales/*` are discovered if present.
- In development, manifest data cooperates with the reload pipeline: CSP and permissions are patched, and minimal background entries are ensured so the reloader can be injected.

## Usage

```ts
import {getManifestFieldsData} from 'browser-extension-manifest-fields'

// Resolve manifest field paths
const fields = getManifestFieldsData({
  manifestPath: '/abs/path/to/manifest.json'
})
```

Sample output:

```json
{
  "html": {
    "action/index": "/abs/path/to/public/chrome-popup.html",
    "options_ui/page": "/abs/path/to/public/options.html"
  },
  "icons": {
    "16": "/abs/path/to/icons/16.png",
    "48": "/abs/path/to/icons/48.png"
  },
  "json": {
    "declarative_net_request": [
      { "id": "rules", "enabled": true, "path": "/abs/path/to/rules/rules_1.json" }
    ]
  },
  "scripts": {
    "background": {
      "service_worker": "/abs/path/to/src/background.js",
      "type": "module"
    },
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["/abs/path/to/src/content.js"],
        "css": ["/abs/path/to/src/content.css"]
      }
    ]
  },
  "web_accessible_resources": {
    "resources": [
      {
        "resources": ["/abs/path/to/assets/*"],
        "matches": ["<all_urls>"]
      }
    ]
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
  scripts: Record<string, any>
  web_accessible_resources: Record<string, any>
}

export function getManifestFieldsData(args: {
  manifestPath: string
  browser?: string
}): ManifestFields
```


## License

MIT (c) Cezar Augusto
