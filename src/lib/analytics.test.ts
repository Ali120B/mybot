// This build ships no telemetry: the upstream project's PostHog token was
// removed, so the promise that matters is that nothing is ever loaded, called
// or sent, whatever the Settings switch says. optAction and the storage
// round-trip stay covered because the switch itself is still in the app.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { analyticsEnabled, initAnalytics, optAction, setAnalyticsEnabled } from "./analytics";

// posthog-js is replaced by a recorder. `loads` counts evaluations of the
// library (an opted-out session must leave it at 0), `calls` is everything
// that would have reached PostHog, in order, and `options` holds what init()
// was given. Each fresh module load gets its own client.
const ph = vi.hoisted(() => {
  const ph = {
    loads: 0,
    fail: false,
    initThrows: false,
    calls: [] as string[],
    options: [] as Record<string, unknown>[],
    registered: [] as Record<string, unknown>[],
    module: () => {
      if (ph.fail) throw new Error("chunk failed to load");
      ph.loads += 1;
      let optedOut = false;
      return {
        default: {
          init: (_token: string, options: Record<string, unknown>) => {
            if (ph.initThrows) throw new Error("init failed");
            ph.calls.push("init");
            ph.options.push(options);
          },
          has_opted_out_capturing: () => optedOut,
          opt_in_capturing: () => {
            optedOut = false;
            ph.calls.push("opt_in_capturing");
          },
          opt_out_capturing: () => {
            optedOut = true;
            ph.calls.push("opt_out_capturing");
          },
          register: (properties: Record<string, unknown>) => { ph.calls.push("register"); ph.registered.push(properties); },
          capture: (event: string) => void ph.calls.push(`capture ${event}`),
          identify: (id: string) => void ph.calls.push(`identify ${id}`),
        },
      };
    },
  };
  return ph;
});
vi.mock("posthog-js", () => ph.module());

// The suite runs on the node environment, which has no localStorage.
const store = new Map<string, string>();
const baseStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
vi.stubGlobal("localStorage", baseStorage);

beforeEach(() => {
  store.clear();
  ph.loads = 0;
  ph.fail = false;
  ph.initThrows = false;
  ph.calls = [];
  ph.options = [];
  ph.registered = [];
});
// Tests that swap in a throwing storage get the base one back even when an
// assertion fails mid-test — an inline restore at the end would be skipped.
afterEach(() => vi.stubGlobal("localStorage", baseStorage));

// A fresh module, so the module-scoped client starts unset: with a used
// module a test passes on leftover state and proves nothing.
// resetModules alone keeps the mocked posthog-js cached, so it is registered
// again: `loads` then counts evaluations by this module graph only.
async function freshAnalytics() {
  vi.resetModules();
  vi.doMock("posthog-js", () => ph.module());
  return import("./analytics");
}

describe("optAction", () => {
  it("initialises on the first opt-in of a session that started off", () => {
    expect(optAction(true, false)).toBe("init");
  });

  it("opts a running client back in rather than initialising twice", () => {
    expect(optAction(true, true)).toBe("opt-in");
  });

  it("stops a running client without waiting for a restart", () => {
    expect(optAction(false, true)).toBe("opt-out");
  });

  it("does nothing when there is no client to stop", () => {
    // The important half: opting out before init must not reach PostHog to
    // tell it so — that request would itself be the leak.
    expect(optAction(false, false)).toBe("none");
  });
});

describe("the stored choice", () => {
  it("is on for a fresh install", () => {
    expect(analyticsEnabled()).toBe(true);
  });

  it("survives a restart once opted out", () => {
    setAnalyticsEnabled(false);
    expect(analyticsEnabled()).toBe(false); // same read a later launch performs
  });

  it("can be turned back on", async () => {
    setAnalyticsEnabled(false);
    setAnalyticsEnabled(true);
    expect(analyticsEnabled()).toBe(true);
    // turning it on starts the client; let that finish inside this test
    // rather than write the install marker into the next one
    await initAnalytics();
  });

  it("holds an opt-out for the session even when the write is rejected", async () => {
    // The failure this guards: the setter swallows the write error, the next
    // read finds nothing and answers "enabled", and a later initAnalytics()
    // starts the client the user just switched off.
    const fresh = await freshAnalytics();
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });

    fresh.setAnalyticsEnabled(false);
    expect(fresh.analyticsEnabled()).toBe(false);
    await fresh.initAnalytics();
    expect(ph.loads).toBe(0);
    expect(store.get("omb-installed")).toBeUndefined();
  });

  it("treats unusable storage as a fresh install rather than failing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });
    expect(analyticsEnabled()).toBe(true);
    expect(() => setAnalyticsEnabled(false)).not.toThrow();
  });
});

describe("initAnalytics while opted out", () => {
  it("returns before loading the client or touching the install marker", async () => {
    store.set("omb-analytics-opt-out", "1"); // as a previous session left it
    const fresh = await freshAnalytics();

    expect(fresh.analyticsEnabled()).toBe(false);
    await fresh.initAnalytics();
    fresh.track("onboarding_step");
    fresh.identifyEmail("someone@example.com");

    // posthog-js was never even evaluated, so no request of its own could
    // leave either. The missing marker also means opting back in later
    // still counts the install.
    expect(ph.loads).toBe(0);
    expect(ph.calls).toEqual([]);
    expect(store.get("omb-installed")).toBeUndefined();
  });
});

// The one suite this build's analytics can honestly keep: without a token
// there is no client to start, no queue to drain, and no request to send.
describe("a build with no telemetry token", () => {
  it("never loads posthog-js, even with analytics switched on", async () => {
    const fresh = await freshAnalytics();
    expect(fresh.analyticsEnabled()).toBe(true); // on by default…
    await fresh.initAnalytics();
    fresh.track("onboarding_step");
    fresh.identifyEmail("someone@example.com");
    // …and still nothing: no token means no client, no call, no install marker.
    expect(ph.loads).toBe(0);
    expect(ph.calls).toEqual([]);
    expect(store.get("omb-installed")).toBeUndefined();
  });

  it("stays silent through being switched off and on again", async () => {
    const fresh = await freshAnalytics();
    fresh.setAnalyticsEnabled(false);
    fresh.setAnalyticsEnabled(true);
    await fresh.initAnalytics();
    fresh.track("after_on");
    expect(ph.loads).toBe(0);
    expect(ph.calls).toEqual([]);
  });

  it("resolves quietly without touching the library, however it would have failed", async () => {
    ph.fail = true;
    const fresh = await freshAnalytics();
    await expect(fresh.initAnalytics()).resolves.toBeUndefined();
    expect(ph.loads).toBe(0);
    expect(ph.calls).toEqual([]);
  });
});
