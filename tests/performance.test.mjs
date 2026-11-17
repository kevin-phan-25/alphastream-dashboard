import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeTrades,
  filterTrades,
  cumulativePnl,
  tradesCsv,
} from "../src/lib/performance.ts";
const trade = (pnl, timestamp = "2026-11-14T12:00:00Z", extras = {}) => ({
  pnl,
  timestamp,
  symbol: "AAPL",
  side: "long",
  qty: 0.25,
  price: 100,
  ...extras,
});
test("breakeven belongs in the denominator, missing or nonfinite PnL is excluded", () => {
  const result = summarizeTrades([
    trade(10),
    trade(-5),
    trade(0),
    trade(undefined),
    trade(NaN),
  ]);
  assert.equal(result.n, 3);
  assert.equal(result.excluded, 2);
  assert.equal(result.breakeven, 1);
  assert.ok(Math.abs(result.winRate - 100 / 3) < 1e-10);
  assert.equal(result.payoffRatio, 2);
  assert.equal(result.expectancy, 5 / 3);
  assert.equal(result.fees, null);
  assert.equal(summarizeTrades([]).netPnl, null);
});
test("UTC end date is inclusive without including the following day", () => {
  const trades = [
    trade(1, "2026-11-14T00:00:00Z"),
    trade(2, "2026-11-14T23:59:59Z"),
    trade(3, "2026-11-15T00:00:00Z"),
    trade(4, "bad-date"),
  ];
  assert.deepEqual(
    filterTrades(trades, "ALL", "2026-11-14", "2026-11-14").map((t) => t.pnl),
    [1, 2],
  );
  assert.equal(filterTrades(trades, "NVDA", "", "").length, 0);
});
test("curve sorts fills, excludes unknown outcomes, and never invents equity", () => {
  assert.deepEqual(
    cumulativePnl([
      trade(-3, "2026-11-15T00:00:00Z"),
      trade(8),
      trade(undefined),
      trade(3, "bad"),
    ]).map((p) => p.value),
    [8, 5],
  );
});
test("CSV preserves fractional quantities, quotes, and neutralizes spreadsheet formulas", () => {
  const csv = tradesCsv([
    trade(-5, undefined, {
      symbol: '=HYPERLINK("bad")',
      exitReason: 'reason, with "quotes"',
      fees: 0.12,
    }),
  ]);
  assert.ok(csv.includes('"0.25"'));
  assert.ok(csv.includes('"-5"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"reason, with ""quotes"""'));
});

test("exit reasons cannot modify object prototypes", () => {
  const summary = summarizeTrades([
    trade(3, undefined, { exitReason: "__proto__" }),
    trade(-1, undefined, { exitReason: "constructor" }),
  ]);
  assert.equal(summary.byReason.__proto__.count, 1);
  assert.equal(summary.byReason.constructor.pnl, -1);
  assert.equal(Object.prototype.count, undefined);
  assert.equal(Object.prototype.pnl, undefined);
});
