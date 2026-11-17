import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { useAlphaStream } from "../src/hooks/useAlphaStream.ts";
import { useCoinbaseStatus } from "../src/hooks/useCoinbaseStatus.ts";
import { CoinbaseConnection } from "../src/components/coinbase/CoinbaseConnection.tsx";
import { observationIsStale } from "../src/lib/freshness.ts";

function environment(t) {
  const listeners = new Map();
  const timers = new Map();
  let id = 0;
  const env = { cleanup: () => {} };
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = {
    setInterval(fn) {
      timers.set(++id, fn);
      return id;
    },
  };
  globalThis.document = {
    visibilityState: "visible",
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name) {
      listeners.delete(name);
    },
  };
  t.mock.method(globalThis, "clearInterval", (key) => timers.delete(key));
  t.after(() => {
    env.cleanup();
    for (const name of ["window", "document"]) {
      if (previous[name] === undefined) delete globalThis[name];
      else globalThis[name] = previous[name];
    }
  });
  return Object.assign(env, { listeners, timers });
}
async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("dashboard retains last valid data on malformed refresh and recovers", async (t) => {
  const env = environment(t);
  let invalid = false;
  let requests = 0;
  let state;
  const bodies = {
    health: { status: "ok" },
    status: { equity: 100, brokerReady: true },
    metrics: { equity: 100 },
    "autonomy/status": { enabled: true },
    "ml/autonomy/status": { enabled: true },
    positions: [],
    trades: [],
    logs: [],
    "ml/status": { ok: true },
    "ml/health": { ok: true },
    ready: { ready: true },
    "ml/ready": { ready: true },
  };
  t.mock.method(globalThis, "fetch", async (url) => {
    requests++;
    const path = String(url).replace("/api/", "");
    return Response.json(
      invalid && path === "status" ? { equity: "invalid" } : bodies[path],
    );
  });
  function Probe() {
    state = useAlphaStream();
    return null;
  }
  let root;
  await act(async () => {
    root = create(React.createElement(Probe));
    await settle();
  });
  env.cleanup = () => act(() => root.unmount());
  assert.equal(state.status.equity, 100);
  assert.equal(state.isStale("status"), false);
  invalid = true;
  await act(async () => {
    await state.refresh();
  });
  assert.equal(state.status.equity, 100);
  assert.equal(state.isStale("status"), true);
  assert.match(state.endpoints.status.error, /Invalid status/);
  invalid = false;
  const before = requests;
  await act(async () => {
    const first = state.refresh();
    assert.equal(first, state.refresh());
    await first;
  });
  assert.equal(requests - before, 12);
  assert.equal(state.isStale("status"), false);
});

test("Coinbase polling retains status, marks errors stale, deduplicates requests, and clears on lock", async (t) => {
  const env = environment(t);
  const { listeners } = env;
  let fail = false;
  let deferred = false;
  let resolve;
  let calls = 0;
  let state;
  const body = {
    storageConfigured: true,
    readOnly: true,
    saved: true,
    connected: true,
    fingerprint: "version",
    activeFingerprint: "version",
  };
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (deferred)
      await new Promise((done) => {
        resolve = done;
      });
    if (fail) throw new Error("offline");
    return Response.json(body);
  });
  function Probe({ operator }) {
    state = useCoinbaseStatus(operator);
    return null;
  }
  let root;
  await act(async () => {
    root = create(React.createElement(Probe, { operator: true }));
    await settle();
  });
  env.cleanup = () => act(() => root.unmount());
  assert.equal(state.stale, false);
  assert.equal(state.status.connected, true);
  fail = true;
  await act(async () => {
    await state.refresh();
  });
  assert.equal(state.stale, true);
  assert.equal(state.status.connected, true);
  assert.match(state.error, /offline/);
  fail = false;
  deferred = true;
  const before = calls;
  let pending;
  await act(async () => {
    pending = state.refresh();
    assert.equal(pending, state.refresh());
  });
  assert.equal(calls - before, 1);
  await act(async () => {
    resolve();
    await pending;
  });
  assert.equal(state.stale, false);
  deferred = false;
  await act(async () => {
    listeners.get("visibilitychange")();
    await settle();
  });
  assert.equal(calls - before, 2);
  await act(async () =>
    root.update(React.createElement(Probe, { operator: false })),
  );
  assert.equal(state.status, null);
  assert.equal(state.stale, true);
});

test("unmount aborts pending Coinbase requests and does not keep polling", async (t) => {
  const { timers } = environment(t);
  let signal;
  t.mock.method(globalThis, "fetch", (url, options) => {
    signal = options.signal;
    return new Promise((resolve, reject) =>
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      ),
    );
  });
  function Probe() {
    useCoinbaseStatus(true);
    return null;
  }
  let root;
  await act(async () => {
    root = create(React.createElement(Probe));
  });
  assert.equal(signal.aborted, false);
  await act(async () => {
    root.unmount();
    await settle();
  });
  assert.equal(signal.aborted, true);
  assert.equal(timers.size, 0);
});

test("age alone makes observations stale, even without a transport failure", () => {
  assert.equal(observationIsStale(1000, null, 16000, 15000), false);
  assert.equal(observationIsStale(1000, null, 16001, 15000), true);
  assert.equal(observationIsStale(null, null, 1000, 15000), true);
  assert.equal(observationIsStale(1000, "offline", 1001, 15000), true);
});

test("Coinbase setup disables mutations and labels the connection stale after a refresh failure", async (t) => {
  const env = environment(t);
  let fail = false;
  t.mock.method(globalThis, "fetch", async () => {
    if (fail) throw new Error("fixture outage");
    return Response.json({
      storageConfigured: true,
      readOnly: true,
      saved: true,
      connected: true,
      fingerprint: "version",
      activeFingerprint: "version",
    });
  });
  let root;
  await act(async () => {
    root = create(
      React.createElement(CoinbaseConnection, {
        operator: true,
        onUnlock: () => {},
      }),
    );
    await settle();
  });
  env.cleanup = () => act(() => root.unmount());
  const reconnect = () =>
    root.root
      .findAllByType("button")
      .find((button) => button.children.join("").includes("Reconnect Core"));
  assert.equal(reconnect().props.disabled, false);
  fail = true;
  await act(async () => {
    env.listeners.get("visibilitychange")();
    await settle();
  });
  assert.equal(reconnect().props.disabled, true);
  assert.equal(root.root.findByType("fieldset").props.disabled, true);
  assert.ok(
    root.root
      .findAllByType("strong")
      .some((node) => node.children.includes("Connection status stale")),
  );
  await act(async () =>
    root.update(
      React.createElement(CoinbaseConnection, {
        operator: false,
        onUnlock: () => {},
      }),
    ),
  );
  assert.equal(root.root.findAllByType("fieldset").length, 0);
});
