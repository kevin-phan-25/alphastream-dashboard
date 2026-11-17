import type { Trade } from "@/types/alphastream";
import { pnlOf } from "@/lib/performance";
import { money, number, timestamp } from "@/lib/display";
import { Badge, Panel, Empty } from "./primitives";
import type { ActionLog } from "@/lib/operator-actions";

export function TradeTable({
  trades,
  known,
}: {
  trades: Trade[];
  known: boolean;
}) {
  if (!known) return <Empty>Trade history is unavailable.</Empty>;
  if (!trades.length) return <Empty>No closed trades in this selection.</Empty>;
  return (
    <div className="table-wrap ledger">
      <table>
        <thead>
          <tr>
            <th>Closed</th>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Exit fill</th>
            <th>Realized PnL</th>
            <th>Exit fees</th>
            <th>Exit reason / order</th>
          </tr>
        </thead>
        <tbody>
          {trades
            .slice()
            .sort(
              (a, b) =>
                (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0),
            )
            .map((trade, index) => (
              <tr key={trade.orderId || trade.id || index}>
                <td>{timestamp(trade.timestamp)}</td>
                <td>
                  <strong>{trade.symbol}</strong>
                </td>
                <td>{number(trade.qty, 8)}</td>
                <td>{money(trade.price)}</td>
                <td
                  className={(pnlOf(trade) ?? 0) < 0 ? "negative" : "positive"}
                >
                  {money(pnlOf(trade))}
                </td>
                <td>{money(trade.fees)}</td>
                <td>
                  {trade.exitReason ?? trade.ExitReason ?? "Unavailable"}
                  <small className="cell-note order-id">
                    {trade.orderId || "Order ID unavailable"}
                  </small>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
export function History({
  history,
  storageError,
}: {
  history: ActionLog[];
  storageError: boolean;
}) {
  return (
    <Panel
      title="Operator request history"
      subtitle="Up to 50 requests retained in this browser · not a server audit log"
    >
      {storageError && (
        <p className="warning">
          Browser storage unavailable. History may not survive a reload.
        </p>
      )}
      {history.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Request</th>
                <th>Outcome</th>
                <th>Service response</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{timestamp(item.time)}</td>
                  <td>{item.action}</td>
                  <td>
                    <Badge
                      tone={
                        item.outcome === "Failed"
                          ? "bad"
                          : item.outcome === "Skipped / rejected"
                            ? "warn"
                            : "good"
                      }
                    >
                      {item.outcome}
                    </Badge>
                  </td>
                  <td>{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No operator requests recorded on this device.</Empty>
      )}
    </Panel>
  );
}
