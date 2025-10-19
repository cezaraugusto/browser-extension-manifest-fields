[powered-image]: https://img.shields.io/badge/Empowering-Extension.js-0971fe
[powered-url]: https://extension.js.org
[version-image]: https://img.shields.io/npm/v/browser-extension-manifest-fields?label=version
[version-url]: https://www.npmjs.com/package/browser-extension-manifest-fields
[ci-image]: https://img.shields.io/github/actions/workflow/status/extension-js/extension.js/pkg-manifest-fields-ci.yml?branch=main&label=CI
[ci-url]: https://github.com/extension-js/extension.js/actions/workflows/pkg-manifest-fields-ci.yml

![Empowering Extension.js][powered-image] ![npm version][version-image] ![CI][ci-image]

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

## Expected output

Given a manifest like:

```json
{
  "manifest_version": 3,
  "action": {"default_popup": "public/p.html"},
  "chromium:action": {"default_popup": "public/c.html"},
  "gecko:action": {"default_popup": "public/f.html"},
  "icons": {"16": "icons/16.png", "48": "icons/48.png"},
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content.js"],
      "css": ["src/content.css"]
    }
  ],
  "web_accessible_resources": [
    {"resources": ["assets/*"], "matches": ["<all_urls>"]}
  ]
}
```

Resolving for Chrome:

```ts
import path from 'node:path'
import {getManifestFieldsData} from 'browser-extension-manifest-fields'

const manifestPath = '/abs/path/to/manifest.json'
const res = getManifestFieldsData({manifestPath, browser: 'chrome'})

// res shape
res ===
  {
    html: {
      // chromium:action beats generic and gecko-prefixed keys for Chrome
      'action/index': path.join(path.dirname(manifestPath), 'public/c.html')
    },
    icons: {
      '16': path.join(path.dirname(manifestPath), 'icons/16.png'),
      '48': path.join(path.dirname(manifestPath), 'icons/48.png')
    },
    json: {},
    scripts: {
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: [path.join(path.dirname(manifestPath), 'src/content.js')],
          css: [path.join(path.dirname(manifestPath), 'src/content.css')]
        }
      ]
    },
    web_accessible_resources: {
      // MV3: keep objects as-is, resources paths normalized to absolute
      resources: [
        {
          resources: [path.join(path.dirname(manifestPath), 'assets/*')],
          matches: ['<all_urls>']
        }
      ]
    }
  }
```

## License

MIT (c) Cezar Augusto
