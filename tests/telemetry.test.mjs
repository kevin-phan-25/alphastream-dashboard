import test from "node:test";
import assert from "node:assert/strict";
import {
  getStatus,
  getPositions,
  getTrades,
  getReadiness,
  apiFetch,
} from "../src/services/alphastream.ts";
import { parseTelemetry, parseCoinbaseStatus } from "../src/lib/validation.ts";

test("malformed successful responses never become accepted telemetry", async (t) => {
  let payload = {
    equity: 100,
    symbols: ["AAPL"],
    autonomy: { lastDecision: { symbol: "AAPL" } },
  };
  t.mock.method(globalThis, "fetch", async () => Response.json(payload));
  assert.equal((await getStatus()).equity, 100);
  for (const invalid of [
    {},
    [],
    { equity: "100" },
    { equity: 100, symbols: [null] },
    { equity: 100, autonomy: { lastDecision: { symbol: {} } } },
  ]) {
    payload = invalid;
    await assert.rejects(getStatus(), /Invalid status/);
  }
  payload = { positions: [{ symbol: "AAPL", qty: 0.25 }] };
  assert.equal((await getPositions())[0].qty, 0.25);
  payload = { positions: [null] };
  await assert.rejects(getPositions(), /Invalid positions/);
  payload = [
    {
      symbol: "AAPL",
      qty: 1,
      price: 100,
      side: "SELL",
      timestamp: "bad-date",
      exitReason: {},
    },
  ];
  await assert.rejects(getTrades(), /Invalid trades/);
  assert.deepEqual(parseTelemetry("positions", []), []);
  assert.throws(() =>
    parseTelemetry("trades", [
      { symbol: "AAPL", qty: 1, price: Infinity, side: "SELL", timestamp: "" },
    ]),
  );
  assert.throws(() =>
    parseCoinbaseStatus({
      storageConfigured: true,
      readOnly: true,
      saved: true,
      connected: "true",
    }),
  );
});

test("503 readiness is a valid observation only when the body is valid", async (t) => {
  let payload = { detail: { ready: false, brokerReady: false } };
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(payload, { status: 503 }),
  );
  assert.equal((await getReadiness("/api/ready")).ready, false);
  payload = { ready: false, brokerReady: "yes" };
  await assert.rejects(getReadiness("/api/ready"), /Invalid ready/);
  payload = { error: "temporarily unavailable" };
  await assert.rejects(getReadiness("/api/ready"), /temporarily unavailable/);
});

test("apiFetch preserves Headers instances and reports upstream failures", async (t) => {
  t.mock.method(globalThis, "fetch", async (path, options) => {
    assert.equal(new Headers(options.headers).get("x-test"), "fixture");
    return Response.json({ error: "request rejected" }, { status: 409 });
  });
  await assert.rejects(
    apiFetch("/api/test", { headers: new Headers({ "x-test": "fixture" }) }),
    /request rejected/,
  );
});

test("unavailable optional fields remain absent without discarding a valid ledger", () => {
  const rows = parseTelemetry("trades", [
    {
      symbol: "AAPL",
      qty: 0.25,
      price: 100,
      side: "SELL",
      timestamp: "2026-11-16T12:00:00Z",
      pnl: null,
      fees: null,
    },
  ]);
  assert.equal(rows[0].pnl, undefined);
  assert.equal(rows[0].fees, undefined);
});
