type Manifest = Record<string, any>;

/**
 * Browser targets understood by {@link filterKeysForThisBrowser}.
 * Any other string is accepted and matched against its own prefix only.
 */
export type BrowserTarget =
  | "chrome"
  | "edge"
  | "firefox"
  | "chromium"
  | "chromium-based"
  | "gecko-based"
  | "firefox-based"
  | "safari"
  | "webkit-based"
  | (string & {});

const CHROMIUM_BASED_BROWSERS = ["chrome", "edge"];
const GECKO_BASED_BROWSERS = ["firefox"];

/**
 * Resolve vendor-prefixed manifest keys (e.g. `"firefox:background"`,
 * `"chromium:permissions"`) for a given browser target.
 *
 * Keys prefixed with the target browser (or its engine family) replace the
 * unprefixed key; prefixed keys for other browsers are dropped. The input
 * manifest is not mutated.
 */
export function filterKeysForThisBrowser(
  manifest: Manifest,
  browser: BrowserTarget,
): Manifest {
  const isChromiumTarget =
    CHROMIUM_BASED_BROWSERS.includes(browser) ||
    String(browser).includes("chromium") ||
    // Safari ships an MV3, chromium-shaped bundle, so it should pick up
    // chromium/chrome-prefixed manifest keys.
    browser === "safari" ||
    browser === "webkit-based" ||
    String(browser).includes("webkit");
  const isGeckoTarget =
    GECKO_BASED_BROWSERS.includes(browser) || String(browser).includes("gecko");

  const chromiumPrefixes = new Set(["chromium", "chrome", "edge"]);
  const geckoPrefixes = new Set(["gecko", "firefox"]);

  const patchedManifest = JSON.parse(
    JSON.stringify(manifest),
    function reviver(this: any, key: string, value: any) {
      const indexOfColon = key.indexOf(":");
      if (indexOfColon === -1) return value;

      const prefix = key.substring(0, indexOfColon);
      if (
        prefix === browser ||
        (isChromiumTarget && chromiumPrefixes.has(prefix)) ||
        (isGeckoTarget && geckoPrefixes.has(prefix))
      ) {
        this[key.substring(indexOfColon + 1)] = value;
      }
    },
  );

  return patchedManifest;
}
