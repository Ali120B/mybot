import { describe, expect, it } from "vitest";
import { FEATURES, register } from "./index.ts";

// enterprise/LICENSE: a license key is not required to run, enable, modify or
// use anything in this folder, in any environment including production. These
// tests hold the layer to that against the shape core validates
// (server/enterprise.ts), so a later edit cannot quietly reintroduce a key
// check, a grace period or an expiry that would paywall a free feature.

describe("register() with no key", () => {
  it("grants every entitlement core can ask for without a key at all", () => {
    expect(register().features).toEqual(["admin", "billing", "budgets", "whitelabel"]);
  });

  it("ignores whatever key and grace period core passes, junk included", () => {
    const expected = { customer: "everyone", features: [...FEATURES], expiresAt: null };
    for (const options of [
      undefined,
      {},
      { licenseKey: "" },
      { licenseKey: "omb1.not.real" },
      { licenseKey: "garbage", graceDays: 1_000 },
      { licenseKey: "expired-long-ago", graceDays: Number.NaN },
    ]) {
      expect(register(options)).toEqual(expected);
    }
  });

  it("never expires, so no feature stops working on a date", () => {
    expect(register({ licenseKey: "anything" }).expiresAt).toBeNull();
  });

  it("answers with a stable, duplicate-free feature list for /api/edition", () => {
    const features = register().features;
    expect([...features].sort()).toEqual(features);
    expect(new Set(features).size).toBe(features.length);
  });

  it("names whoever runs the copy rather than a buyer", () => {
    expect(register().customer.length).toBeGreaterThan(0);
  });
});
