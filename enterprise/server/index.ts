// Entry point core loads when this folder exists (see server/enterprise.ts).
// Nothing here is gated: enterprise/LICENSE permits copying, editing,
// redistribution and commercial use, and says in so many words that a license
// key is not required to run, enable, modify or use any of it, in any
// environment including production. So there is no key to verify and nothing
// to expire. register() reports the full feature set for every deployment,
// which is what lets core's `entitled()` gates pass without an operator
// supplying a credential, and hosted workspace sign-in (workspace-access.ts)
// works the moment this folder is present and configured.
export { createWorkspaceAccess } from "./workspace-access.ts";

export interface RegisteredLayer {
  customer: string;
  features: string[];
  expiresAt: string | null;
}

/** Every entitlement id core can ask for: `admin` (hosted sign-in and remote
 * access), `budgets` (monthly spend limits), `billing` (sell prices) and
 * `whitelabel` (custom brand). All of them, always:
 * they are free features rather than a paid tier, so this layer withholds
 * nothing and no deployment is held back for not paying. */
export const FEATURES = ["admin", "billing", "budgets", "whitelabel"] as const;

/** Core still hands us the key it read from the environment and the grace
 * period it would grant an expiring one. Both are ignored on purpose: a junk
 * value is as good as no value, and there is no expiry to be graceful about.
 * `customer` is display only — core echoes it in the startup log and
 * /api/edition — so it names whoever is running the copy instead of a buyer,
 * and `expiresAt: null` keeps it perpetual. */
export function register(_options?: { licenseKey?: string; graceDays?: number }): RegisteredLayer {
  return { customer: "everyone", features: [...FEATURES], expiresAt: null };
}
