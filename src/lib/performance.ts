import type { Trade } from "../types/alphastream";

export const MAG7 = [
  "AAPL",
  "AMZN",
  "GOOGL",
  "META",
  "MSFT",
  "NVDA",
  "TSLA",
] as const;
export function pnlOf(trade: Trade): number | null {
  const value = trade.pnl ?? trade.PnL;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function filterTrades(
  trades: Trade[],
  symbol: string,
  from: string,
  to: string,
) {
  // Date controls use UTC calendar days; to is inclusive.
  const start = from ? Date.parse(`${from}T00:00:00Z`) : -Infinity;
  const end = to ? Date.parse(`${to}T00:00:00Z`) + 86_400_000 : Infinity;
  return trades.filter((trade) => {
    if (symbol !== "ALL" && trade.symbol !== symbol) return false;
    if (!from && !to) return true;
    const time = Date.parse(trade.timestamp);
    return Number.isFinite(time) && time >= start && time < end;
  });
}
export function summarizeTrades(trades: Trade[]) {
  const valid = trades.filter((trade) => pnlOf(trade) !== null);
  const wins = valid.filter((trade) => pnlOf(trade)! > 0);
  const losses = valid.filter((trade) => pnlOf(trade)! < 0);
  const netPnl = valid.reduce((sum, trade) => sum + pnlOf(trade)!, 0);
  const avgWin = wins.length
    ? wins.reduce((sum, trade) => sum + pnlOf(trade)!, 0) / wins.length
    : null;
  const avgLoss = losses.length
    ? -losses.reduce((sum, trade) => sum + pnlOf(trade)!, 0) / losses.length
    : null;
  const byReason: Record<string, { count: number; pnl: number }> =
    Object.create(null);
  for (const trade of valid) {
    const reason =
      (trade.exitReason ?? trade.ExitReason ?? "unknown").split(" ")[0] ||
      "unknown";
    byReason[reason] ??= { count: 0, pnl: 0 };
    byReason[reason].count++;
    byReason[reason].pnl += pnlOf(trade)!;
  }
  const feesComplete =
    trades.length > 0 &&
    trades.every(
      (trade) => typeof trade.fees === "number" && Number.isFinite(trade.fees),
    );
  return {
    n: valid.length,
    excluded: trades.length - valid.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: valid.length - wins.length - losses.length,
    winRate: valid.length ? (wins.length / valid.length) * 100 : null,
    netPnl: valid.length ? netPnl : null,
    expectancy: valid.length ? netPnl / valid.length : null,
    avgWin,
    avgLoss,
    payoffRatio: avgWin !== null && avgLoss !== null ? avgWin / avgLoss : null,
    fees: feesComplete
      ? trades.reduce((sum, trade) => sum + trade.fees!, 0)
      : null,
    byReason,
  };
}

export function cumulativePnl(trades: Trade[]) {
  let sum = 0;
  return trades
    .filter(
      (trade) =>
        pnlOf(trade) !== null && Number.isFinite(Date.parse(trade.timestamp)),
    )
    .slice()
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .map((trade) => ({ trade, value: (sum += pnlOf(trade)!) }));
}

export function tradesCsv(trades: Trade[]) {
  const escape = (value: unknown) => {
    let text = value == null ? "" : String(value);
    // Neutralize spreadsheet formulas in text supplied by upstream services.
    if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text))
      text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows: unknown[][] = [
    [
      "timestamp",
      "symbol",
      "side",
      "quantity",
      "fillPrice",
      "realizedPnl",
      "reportedExitFees",
      "exitReason",
      "orderId",
    ],
  ];
  for (const trade of trades)
    rows.push([
      trade.timestamp,
      trade.symbol,
      trade.side,
      trade.qty,
      trade.price,
      pnlOf(trade),
      trade.fees,
      trade.exitReason ?? trade.ExitReason,
      trade.orderId,
    ]);
  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
