// The handful of outward links the app offers from the profile menu and the
// About dialog. They are collected here so "where does Help go?" has one
// answer rather than one per call site.
//
// This is a personal build: the only outward links are this build's own
// repository and the Apache licence text. Every link to the upstream project
// (its website, repo, Discord, pricing, phone apps) has been removed.
export const APP_NAME = "OpenMausBot";
/** Who maintains this build: the About dialog's "GitHub" button opens it. */
export const APP_REPOSITORY = "https://github.com/Ali120B/mybot";
/** The Apache 2.0 licence text, on apache.org rather than any project repo. */
export const LICENSE_URL = "https://www.apache.org/licenses/LICENSE-2.0";

/** The version Vite inlined from package.json; "dev" when the define is
 * missing (a bare `tsc`/test run outside the bundler). */
export function appVersion(): string {
  return typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
}

const PLATFORM_NAMES: Record<string, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
};

/** "macOS", "Windows", "Linux" — or nothing at all in the browser, where the
 * host OS is not ours to claim. */
export function platformLabel(platform?: string): string | null {
  return (platform && PLATFORM_NAMES[platform]) ?? null;
}

/** Hands a link to the default browser through the preload bridge, falling
 * back to a new tab when the app runs in a plain browser. */
export async function openExternalLink(url: string): Promise<void> {
  if (window.ogb?.openExternal) {
    await window.ogb.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
