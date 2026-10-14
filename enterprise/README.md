# enterprise/

The optional layer that `server/enterprise.ts` loads when this folder is
present. Delete the folder and the server runs the plain open-source edition;
keep it and every feature listed below turns on.

## Free to run, free to copy, free to replicate

This folder is covered by its own [LICENSE](LICENSE): you may copy, modify,
adapt and edit it, redistribute and sublicense it, host it for third parties,
white-label it, or include it in commercial products.

**No license key is required.** Nothing here needs to be bought, requested,
activated or renewed to run, enable, modify or use it — in any environment,
including production. `register()` reports the full feature set to every
deployment and returns `expiresAt: null`, so no feature ever stops working on
a date and no operator is ever asked to prove they paid.

Core still passes `OMB_LICENSE_KEY` and a grace period through when it finds
them, for layers that want such a thing; this one ignores both. Setting,
changing or omitting that variable changes nothing here.

## What is in it

- `server/index.ts` — what core imports: `register()`, which reports the
  entitlements, and the `createWorkspaceAccess` export.
- `server/workspace-access.ts` — the workspace half of hosted sign-in: the
  PKCE handoff to the configured identity service, plus the continuous check
  that revokes a session whose membership ends.
- `server/*.test.ts` — the tests that hold both to their promises.

Granted on every run: `admin` (hosted sign-in, remote access, fleet
workspaces), `budgets` (monthly spend limits), `billing` (sell prices), `sso`
and `whitelabel` (custom brand). They are free features, not paid tiers.

## Tests

```sh
npx vitest run enterprise
pnpm typecheck
pnpm lint
```

## Shipping it

`scripts/bundle-server.mjs` bundles `server/index.ts` to
`dist-server/enterprise/server/index.js` and copies this `LICENSE` beside it,
so a packaged server or image finds the layer inside its own server root.
`scripts/build-npm-package.mjs` copies the bundle and this file to
`<package>/enterprise/`, the path core loads from in an npm install.
