"use client";
import {
  Badge,
  Stat,
  Panel,
  Empty,
  JsonDetails,
} from "@/components/dashboard/primitives";
import { History } from "@/components/dashboard/tables";
import { money, number, percent, yesNo, timestamp, ago } from "@/lib/display";
import {
  ACTIONS,
  HISTORY_KEY,
  type Action,
  type ActionLog,
} from "@/lib/operator-actions";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useAlphaStream, type Endpoint } from "@/hooks/useAlphaStream";
import { useOperatorSession } from "@/hooks/useOperatorSession";
import { apiFetch } from "@/services/alphastream";
import { CoinbaseConnection } from "@/components/coinbase/CoinbaseConnection";
import dynamic from "next/dynamic";
const PerformanceView = dynamic(
  () => import("@/components/dashboard/PerformanceView"),
  { loading: () => <p role="status">Loading performance…</p> },
);
import { MAG7 } from "@/lib/performance";
import type { AlphaStreamMLStatus } from "@/types/alphastream";

const VIEWS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "connection", label: "Coinbase setup", icon: ShieldCheck },
  { id: "mag7", label: "MAG7 decisions", icon: ScanLine },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "models", label: "Models", icon: BrainCircuit },
  { id: "operations", label: "Operations", icon: Settings2 },
] as const;
type View = (typeof VIEWS)[number]["id"];
export default function DashboardPage() {
  const stream = useAlphaStream(0);
  const {
    status,
    metrics,
    autonomy,
    mlAutonomy,
    mlStatus,
    positions,
    trades,
    logs,
    ready,
    mlReady,
    endpoints,
    now,
    isStale,
    refresh,
    refreshing,
  } = stream;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("overview");
  const {
    operator,
    operatorConfigured,
    setOperator,
    signIn: unlockSession,
    signOut: lockSession,
  } = useOperatorSession();
  const [unlock, setUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [history, setHistory] = useState<ActionLog[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  useEffect(() => {
    if ((unlock || confirm) && dialogRef.current && !dialogRef.current.open)
      dialogRef.current.showModal();
  }, [unlock, confirm]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (VIEWS.some((item) => item.id === hash)) setView(hash as View);
    const onHash = () => {
      const next = window.location.hash.slice(1);
      if (VIEWS.some((item) => item.id === next)) setView(next as View);
    };
    window.addEventListener("hashchange", onHash);
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || "[]",
      );
      if (Array.isArray(saved))
        setHistory(
          saved
            .filter(
              (row): row is ActionLog =>
                row &&
                ["id", "time", "action", "outcome", "message"].every(
                  (key) => typeof row[key] === "string",
                ),
            )
            .slice(0, 50),
        );
    } catch {
      setStorageError(true);
    }
    setStorageReady(true);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      setStorageError(true);
    }
  }, [history, storageReady]);

  const ml: AlphaStreamMLStatus | null = mlStatus ?? status?.ml ?? null;
  const auto = autonomy?.autonomy ?? autonomy ?? status?.autonomy;
  const equity = status?.equity ?? metrics?.equity;
  const brokerReady = !isStale("ready")
    ? ready?.brokerReady
    : !isStale("status")
      ? status?.brokerReady
      : undefined;
  const tradingEnabled = !isStale("ready")
    ? ready?.tradingEnabled
    : !isStale("status")
      ? status?.tradingEnabled
      : undefined;
  const reason = status?.brokerError || ready?.error || auto?.reason;
  const staleCount = (Object.keys(endpoints) as Endpoint[]).filter((key) =>
    isStale(key),
  ).length;
  const positionKnown = Boolean(endpoints.positions.lastSuccess);
  const tradeKnown = Boolean(endpoints.trades.lastSuccess);
  const exposure =
    positionKnown &&
    positions.every(
      (p) =>
        typeof p.marketValue === "number" && Number.isFinite(p.marketValue),
    )
      ? positions.reduce((sum, p) => sum + p.marketValue!, 0)
      : null;
  const unrealized =
    positionKnown &&
    positions.every(
      (p) => typeof (p.unrealizedPnl ?? p.unrealizedPL) === "number",
    )
      ? positions.reduce(
          (sum, p) => sum + (p.unrealizedPnl ?? p.unrealizedPL)!,
          0,
        )
      : null;
  const policyMismatch = status?.longOnly === true && ml?.longOnly === false;
  const modelAuto = mlAutonomy ?? ml?.autonomy;
  const title = VIEWS.find((item) => item.id === view)!.label;

  function navigate(next: View) {
    setView(next);
    window.location.hash = next;
  }
  function freshness(key: Endpoint) {
    const state = endpoints[key];
    return (
      <div className="freshness">
        <Badge
          tone={isStale(key) ? (state.lastSuccess ? "warn" : "muted") : "good"}
        >
          {state.lastSuccess
            ? isStale(key)
              ? "Stale"
              : "Fresh"
            : "Unavailable"}
        </Badge>
        <span>Received {ago(state.lastSuccess, now)}</span>
        {state.error && <span className="negative">{state.error}</span>}
      </div>
    );
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await unlockSession(password);
      setUnlock(false);
      setPassword("");
      setNotice({
        message: "Operator controls unlocked for up to 8 hours.",
        error: false,
      });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Unable to unlock",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  async function lock() {
    setBusy(true);
    try {
      await lockSession();
    } catch {
      setNotice({
        message: "Could not end the operator session. Try again.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  async function execute(action: Action) {
    setBusy(true);
    setNotice(null);
    let outcome = "Failed",
      message = "Request failed";
    try {
      const result = await apiFetch<Record<string, unknown>>(
        ACTIONS[action].path,
        {
          method: "POST",
          signal: AbortSignal.timeout(
            action === "scan" ? 250_000 : action === "train" ? 190_000 : 20_000,
          ),
        },
      );
      const failed = result.ok === false || typeof result.error === "string";
      outcome = failed
        ? "Skipped / rejected"
        : action === "scan" && result.completed !== true
          ? "Requested"
          : "Completed";
      message = String(
        result.message ??
          result.reason ??
          result.error ??
          (action === "scan"
            ? "Scan requested; completion is reported by Core."
            : "Request completed."),
      );
      setNotice({ message, error: failed });
    } catch (error) {
      message = error instanceof Error ? error.message : "Request failed";
      if (/unlock|operator|unauthorized/i.test(message)) setOperator(false);
      setNotice({ message, error: true });
    } finally {
      setHistory((previous) =>
        [
          {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            action: ACTIONS[action].title,
            outcome,
            message,
          },
          ...previous,
        ].slice(0, 50),
      );
      setBusy(false);
      setConfirm(null);
      void refresh();
    }
  }
  const actionButton = (action: Action, label: string) => (
    <button
      className={action.startsWith("clear") ? "button button-danger" : "button"}
      disabled={
        busy ||
        !operator ||
        (action === "scan"
          ? isStale("status")
          : action === "train"
            ? isStale("mlStatus")
            : isStale("ready"))
      }
      onClick={() => setConfirm(action)}
    >
      {action === "train" ? (
        <BrainCircuit size={15} />
      ) : (
        <ShieldCheck size={15} />
      )}{" "}
      {label}
    </button>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#overview"
          onClick={() => navigate("overview")}
          className="brand"
        >
          <span className="brand-mark">
            <Activity size={23} />
          </span>
          <span>
            AlphaStream<small>TRADING OPERATIONS</small>
          </span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>MAG7</span>
        </div>
        <nav aria-label="Dashboard sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {view === item.id && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="universe-icon">
            <ShieldCheck size={19} />
          </div>
          <strong>Fixed equity universe</strong>
          <p>Seven stocks. Long-only execution policy.</p>
          <span>Core → Coinbase · ML → Core</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <span>{title}</span>
          </div>
          <div className="topbar-actions">
            <Badge tone={stream.connected ? "good" : "muted"}>
              Core {stream.connected ? "reachable" : "unavailable"}
            </Badge>
            <button
              className="button button-quiet"
              disabled={busy}
              onClick={() => (operator ? void lock() : setUnlock(true))}
            >
              <LockKeyhole size={14} />
              {operator ? "Lock controls" : "Operator access"}
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">ALPHASTREAM / {view.toUpperCase()}</p>
              <h1>{title}</h1>
              <p className="page-description">
                {view === "overview"
                  ? "A clear view of your trading system, from readiness to results."
                  : view === "connection"
                    ? "Secure credentials, portfolio selection and read-only account checks."
                    : view === "mag7"
                      ? "The fixed universe and the evidence behind each decision."
                      : view === "portfolio"
                        ? "Bot-managed positions, capital allocation and available shares."
                        : view === "performance"
                          ? "Closed-trade outcomes with explicit history coverage."
                          : view === "models"
                            ? "Learning activity, serving policy and model lifecycle."
                            : "Service health, recovery controls and request history."}
              </p>
            </div>
            <button
              className="button"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh data"}
            </button>
          </div>
          {notice && (
            <div
              className={`notice ${notice.error ? "notice-error" : "notice-success"}`}
              role={notice.error ? "alert" : "status"}
            >
              <span>{notice.message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {staleCount > 0 && (
            <div className="data-notice">
              <Clock3 size={15} />
              <span>
                {refreshing && !endpoints.status.lastSuccess
                  ? "Connecting to Core and ML…"
                  : `${staleCount} data sources are stale or unavailable. Retained values show their last successful receipt.`}
              </span>
              <button onClick={() => navigate("operations")}>
                View health <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {view === "connection" && (
            <CoinbaseConnection
              operator={operator}
              onUnlock={() => setUnlock(true)}
            />
          )}

          {view === "overview" && (
            <>
              <section
                className={`readiness-banner ${tradingEnabled === true ? "ready" : ""}`}
              >
                <div className="readiness-icon">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="eyebrow">EXECUTION STATUS</p>
                  <h2>
                    {tradingEnabled === true
                      ? "Trading enabled"
                      : tradingEnabled === false
                        ? "Trading blocked"
                        : "Trading status unavailable"}
                  </h2>
                  <p>
                    {reason
                      ? String(reason).replace(/_/g, " ")
                      : "Awaiting a current readiness observation from Core."}
                  </p>
                </div>
                <Badge
                  tone={
                    brokerReady === true
                      ? "good"
                      : brokerReady === false
                        ? "warn"
                        : "muted"
                  }
                >
                  {brokerReady === true
                    ? "Broker ready"
                    : brokerReady === false
                      ? "Broker not ready"
                      : "Broker unknown"}
                </Badge>
              </section>
              {freshness("ready")}
              <div className="stats-grid">
                <Stat
                  label="Account equity"
                  value={money(equity)}
                  note={
                    isStale("status")
                      ? "Status unavailable or stale"
                      : "Selected Coinbase portfolio"
                  }
                />
                <Stat
                  label="Available buying power"
                  value={money(status?.buyingPower ?? metrics?.buyingPower)}
                  note="Reported by Core"
                />
                <Stat
                  label="Managed positions"
                  value={positionKnown ? positions.length : "—"}
                  note="Bot-owned positions only"
                />
                <Stat
                  label="Drawdown from peak"
                  value={percent(
                    status?.drawdownPct ??
                      status?.drawdown ??
                      metrics?.drawdownPct,
                  )}
                  note={`Peak ${money(status?.peakEquity ?? metrics?.peakEquity)}`}
                />
              </div>
              {freshness("status")}
              <div className="two-columns">
                <Panel
                  title="Operating conditions"
                  subtitle="Execution gates and schedule"
                >
                  <dl className="detail-list">
                    <div>
                      <dt>Execution policy</dt>
                      <dd>
                        {status?.longOnly === true
                          ? "Long-only equities"
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Mode</dt>
                      <dd>
                        {status?.paperTradingEnabled === true
                          ? "Read-only"
                          : status?.liveTradingEnabled === true &&
                              status?.paperTradingEnabled === false
                            ? "Live"
                            : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Entries disabled</dt>
                      <dd>{yesNo(status?.entriesDisabled)}</dd>
                    </div>
                    <div>
                      <dt>Venue session</dt>
                      <dd>Unavailable</dd>
                    </div>
                    <div>
                      <dt>Scheduled entry window</dt>
                      <dd>
                        {auto?.entryWindow
                          ? `${auto.entryWindow} ET`
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Inside scheduled window</dt>
                      <dd>{yesNo(auto?.inEntryWindow)}</dd>
                    </div>
                    <div>
                      <dt>Last account sync</dt>
                      <dd>{timestamp(status?.lastSync)}</dd>
                    </div>
                  </dl>
                  <p className="footnote">
                    The scheduled window does not establish venue availability.
                    Core independently checks the exchange session before
                    execution.
                  </p>
                </Panel>
                <Panel
                  title="Latest execution decision"
                  subtitle="Core records this after a successful entry"
                  aside={<ScanLine size={18} className="muted" />}
                >
                  {auto?.lastDecision ? (
                    <>
                      <div className="decision-hero">
                        <strong>{auto.lastDecision.symbol || "—"}</strong>
                        <Badge tone="good">
                          {auto.lastDecision.decision || "Unknown"}
                        </Badge>
                      </div>
                      <dl className="detail-list">
                        <div>
                          <dt>Confidence</dt>
                          <dd>{percent(auto.lastDecision.confidence)}</dd>
                        </div>
                        <div>
                          <dt>Recorded</dt>
                          <dd>{timestamp(auto.lastDecision.timestamp)}</dd>
                        </div>
                        <div>
                          <dt>Risk approved</dt>
                          <dd>{yesNo(auto.lastDecision.riskApproved)}</dd>
                        </div>
                      </dl>
                      <p className="footnote">
                        {auto.lastDecision.reason || "No reason supplied"}
                      </p>
                    </>
                  ) : (
                    <Empty>
                      No successful entry decision has been reported. Holds and
                      rejected candidates are not currently exposed.
                    </Empty>
                  )}
                  {freshness("autonomy")}
                </Panel>
              </div>
              <Panel
                title="At a glance"
                subtitle="Trading activity and learning are tracked independently"
              >
                <div className="stats-grid compact">
                  <Stat
                    label="Entries today"
                    value={auto?.dailyEntries ?? "—"}
                    note={`Limit ${auto?.maxTradesDay ?? "unavailable"}`}
                  />
                  <Stat
                    label="Last scan"
                    value={ago(auto?.lastScan, now)}
                    note={
                      auto?.scanIntervalSec
                        ? `${auto.scanIntervalSec}s configured interval`
                        : "Scan interval unavailable"
                    }
                  />
                  <Stat
                    label="Replay experiences"
                    value={number(ml?.totalExperiences, 0)}
                    note="Shared models across MAG7"
                  />
                  <Stat
                    label="ML readiness"
                    value={
                      !isStale("mlReady") && mlReady
                        ? mlReady.ready
                          ? "Ready"
                          : "Not ready"
                        : "Unavailable"
                    }
                    note="Service readiness, not performance validation"
                  />
                </div>
              </Panel>
            </>
          )}

          {view === "mag7" && (
            <>
              <Panel
                title="MAG7 decision board"
                subtitle="AAPL · AMZN · GOOGL · META · MSFT · NVDA · TSLA"
                aside={<Badge>7 equities</Badge>}
              >
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Managed position</th>
                        <th>Latest executed action</th>
                        <th>Confidence</th>
                        <th>Data freshness</th>
                        <th>Entry eligibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MAG7.map((ticker) => {
                        const held = positions.find((p) => p.symbol === ticker);
                        const decision =
                          auto?.lastDecision?.symbol === ticker
                            ? auto.lastDecision
                            : null;
                        return (
                          <tr key={ticker}>
                            <td>
                              <span className="ticker-cell">
                                <span className="ticker-avatar">
                                  {ticker.slice(0, 1)}
                                </span>
                                <strong>{ticker}</strong>
                              </span>
                            </td>
                            <td>
                              {positionKnown ? (
                                held ? (
                                  <Badge
                                    tone={
                                      isStale("positions") ? "warn" : "good"
                                    }
                                  >
                                    {number(held.qty, 8)} shares
                                    {isStale("positions") ? " · stale" : ""}
                                  </Badge>
                                ) : isStale("positions") ? (
                                  "Unknown · stale snapshot"
                                ) : (
                                  "None"
                                )
                              ) : (
                                "Unavailable"
                              )}
                            </td>
                            <td>
                              {decision?.decision ?? "Unavailable"}
                              {decision && (
                                <small className="cell-note">
                                  {ago(decision.timestamp, now)}
                                </small>
                              )}
                            </td>
                            <td>{percent(decision?.confidence)}</td>
                            <td>
                              <Badge>Not reported</Badge>
                            </td>
                            <td>
                              {held && !isStale("positions")
                                ? "Already held"
                                : "Unavailable"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {freshness("positions")}
              </Panel>
              <div className="two-columns">
                <Panel
                  title="Why no entry?"
                  subtitle="Current system-level observation"
                >
                  <div className="reason-box">
                    <Activity size={18} />
                    <span>
                      {reason
                        ? String(reason).replace(/_/g, " ")
                        : "No current reason supplied by Core"}
                    </span>
                  </div>
                  <dl className="detail-list">
                    <div>
                      <dt>Hard flat</dt>
                      <dd>{yesNo(status?.hardFlat)}</dd>
                    </div>
                    <div>
                      <dt>Degraded</dt>
                      <dd>{yesNo(status?.degraded)}</dd>
                    </div>
                    <div>
                      <dt>Inside scheduled window</dt>
                      <dd>{yesNo(auto?.inEntryWindow)}</dd>
                    </div>
                  </dl>
                </Panel>
                <Panel
                  title="Scanner coverage"
                  subtitle="Additional telemetry needed"
                >
                  <p className="body-copy">
                    The current API does not expose per-stock holds, confidence
                    rejections, slope checks, cooldowns, or quote and candle
                    timestamps. A successful entry is the only decision shown
                    here.
                  </p>
                  <p className="footnote">
                    A per-symbol scan feed is needed to explain every candidate
                    without inferring eligibility from missing data.
                  </p>
                  {actionButton("scan", "Request scan")}
                </Panel>
              </div>
            </>
          )}

          {view === "portfolio" && (
            <>
              <div className="stats-grid">
                <Stat label="Account equity" value={money(equity)} />
                <Stat label="Managed market value" value={money(exposure)} />
                <Stat
                  label="Managed allocation"
                  value={
                    typeof equity === "number" &&
                    equity > 0 &&
                    exposure !== null
                      ? percent((exposure / equity) * 100)
                      : "—"
                  }
                />
                <Stat
                  label="Open unrealized PnL"
                  value={money(unrealized)}
                  tone={
                    unrealized !== null && unrealized < 0
                      ? "negative"
                      : "positive"
                  }
                />
              </div>
              <Panel
                title="Managed positions"
                subtitle="Fractional shares are displayed with up to eight decimals"
              >
                {freshness("positions")}
                {!positionKnown ? (
                  <Empty>Positions are unavailable.</Empty>
                ) : positions.length === 0 ? (
                  <Empty>
                    {isStale("positions")
                      ? "The last received snapshot contained no positions. Current holdings are unknown."
                      : "No bot-managed positions in the latest snapshot."}
                  </Empty>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Quantity</th>
                          <th>Entry price</th>
                          <th>Market value</th>
                          <th>Allocation</th>
                          <th>Unrealized PnL</th>
                          <th>Available to sell</th>
                          <th>Opened</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((p) => (
                          <tr key={p.symbol}>
                            <td>
                              <strong>{p.symbol}</strong>
                              <small className="cell-note">
                                {p.side ?? "Side unavailable"}
                              </small>
                            </td>
                            <td>{number(p.qty, 8)}</td>
                            <td>{money(p.avgEntryPrice ?? p.entry)}</td>
                            <td>{money(p.marketValue)}</td>
                            <td>
                              {typeof equity === "number" &&
                              equity > 0 &&
                              p.marketValue != null
                                ? percent((p.marketValue / equity) * 100)
                                : "—"}
                            </td>
                            <td
                              className={
                                (p.unrealizedPnl ?? p.unrealizedPL ?? 0) < 0
                                  ? "negative"
                                  : "positive"
                              }
                            >
                              {money(p.unrealizedPnl ?? p.unrealizedPL)}
                            </td>
                            <td>{number(p.availableQty, 8)}</td>
                            <td>{timestamp(p.openedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
              <div className="two-columns">
                <Panel
                  title="Risk detail"
                  subtitle="Use reported thresholds only"
                >
                  {positions.length ? (
                    <dl className="detail-list">
                      {positions.map((p) => (
                        <div key={p.symbol}>
                          <dt>{p.symbol} stop / target</dt>
                          <dd>
                            {percent(
                              p.stopLossPct == null
                                ? undefined
                                : p.stopLossPct * 100,
                            )}{" "}
                            /{" "}
                            {percent(
                              p.takeProfitPct == null
                                ? undefined
                                : p.takeProfitPct * 100,
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="body-copy">
                      No position thresholds available.
                    </p>
                  )}
                  <p className="footnote">
                    Core does not currently expose configured stops, take-profit
                    levels, or dollar risk in the positions API. These values
                    are not estimated from defaults.
                  </p>
                </Panel>
                <Panel
                  title="Ownership and reconciliation"
                  subtitle="Account totals and managed positions have different scopes"
                >
                  <p className="body-copy">
                    Account equity covers the selected portfolio. This table
                    covers positions tracked as bot-owned. Core does not
                    automatically adopt external holdings.
                  </p>
                  <dl className="detail-list">
                    <div>
                      <dt>Pending order</dt>
                      <dd>
                        {status?.coinbasePendingOrderId ||
                          "Not exposed by current API"}
                      </dd>
                    </div>
                    <div>
                      <dt>Broker status</dt>
                      <dd>
                        {brokerReady === true
                          ? "Ready"
                          : brokerReady === false
                            ? "Not ready"
                            : "Unavailable"}
                      </dd>
                    </div>
                  </dl>
                </Panel>
              </div>
            </>
          )}

          {view === "performance" && (
            <PerformanceView
              trades={trades}
              tradeKnown={tradeKnown}
              freshness={freshness("trades")}
            />
          )}

          {view === "models" && (
            <>
              {policyMismatch && (
                <div className="notice notice-error" role="alert">
                  Policy mismatch: Core reports long-only execution, while ML
                  status reports longOnly=false. The ML status contract needs
                  correction.
                </div>
              )}
              <div className="stats-grid">
                <Stat
                  label="Entry replay"
                  value={number(ml?.entryBufferSize, 0)}
                />
                <Stat
                  label="Exit replay"
                  value={number(ml?.exitBufferSize, 0)}
                />
                <Stat
                  label="Pending feedback"
                  value={number(
                    ml?.lifecycle?.pending ?? ml?.autonomy?.lifecycle?.pending,
                    0,
                  )}
                />
                <Stat
                  label="Training today"
                  value={
                    modelAuto?.trainsToday == null
                      ? "—"
                      : `${modelAuto.trainsToday} / ${modelAuto.maxTrainsPerDay ?? "—"}`
                  }
                />
              </div>
              {freshness(mlStatus ? "mlStatus" : "status")}
              <div className="two-columns">
                <Panel
                  title="Learning service"
                  subtitle="Direct ML status takes precedence over Core’s summary"
                >
                  <dl className="detail-list">
                    <div>
                      <dt>Scope</dt>
                      <dd>{ml?.modelScope ?? "Unavailable"}</dd>
                    </div>
                    <div>
                      <dt>ML-reported long-only</dt>
                      <dd>{yesNo(ml?.longOnly)}</dd>
                    </div>
                    <div>
                      <dt>Boot complete</dt>
                      <dd>{yesNo(ml?.bootComplete)}</dd>
                    </div>
                    <div>
                      <dt>Training enabled</dt>
                      <dd>{yesNo(ml?.trainingEnabled)}</dd>
                    </div>
                    <div>
                      <dt>Can train</dt>
                      <dd>{yesNo(modelAuto?.canTrain)}</dd>
                    </div>
                    <div>
                      <dt>Training running</dt>
                      <dd>{yesNo(modelAuto?.running)}</dd>
                    </div>
                    <div>
                      <dt>Challenger mode</dt>
                      <dd>{yesNo(modelAuto?.challengerMode)}</dd>
                    </div>
                    <div>
                      <dt>Last train</dt>
                      <dd>
                        {timestamp(modelAuto?.lastTrain ?? ml?.lastTrain)}
                      </dd>
                    </div>
                    <div>
                      <dt>Last load / save</dt>
                      <dd>
                        {timestamp(ml?.lastLoad)}
                        <small className="cell-note">
                          {timestamp(ml?.lastSave)}
                        </small>
                      </dd>
                    </div>
                  </dl>
                  <p className="footnote">
                    {modelAuto?.lastSkipReason ||
                      modelAuto?.reason ||
                      "No training reason reported."}
                  </p>
                  {actionButton("train", "Run autonomy training")}
                </Panel>
                <Panel
                  title="Model registry"
                  subtitle="Serving model and candidate evidence"
                >
                  <JsonDetails label="Champion" value={mlAutonomy?.champion} />
                  <JsonDetails
                    label="Candidate"
                    value={mlAutonomy?.candidate}
                  />
                  <JsonDetails
                    label="Last training result"
                    value={mlAutonomy?.lastResult}
                  />
                  <JsonDetails
                    label="Last promotion"
                    value={
                      mlAutonomy?.lastPromotion ?? ml?.autonomy?.lastPromotion
                    }
                  />
                  <JsonDetails label="Archives" value={mlAutonomy?.archives} />
                  <JsonDetails
                    label="Watchdog / rollback"
                    value={mlAutonomy?.watchdog ?? ml?.autonomy?.watchdog}
                  />
                  <JsonDetails
                    label="Strategy profile"
                    value={mlAutonomy?.strategy ?? ml?.autonomy?.strategy}
                  />
                  {freshness("mlAutonomy")}
                </Panel>
              </div>
              <Panel
                title="Interpretation"
                subtitle="Separate model diagnostics from trading results"
              >
                <p className="body-copy">
                  Replay holdout scores measure model outputs and agreement with
                  stored actions. They do not establish executable strategy
                  returns. Training an exit model also does not mean Core
                  delegates position exits to it; Core currently applies its own
                  exit rules.
                </p>
                <p className="footnote">
                  A trained-weight readiness flag and a durable server-side
                  training audit are not currently exposed. Service readiness
                  alone does not establish that a model is trained.
                </p>
              </Panel>
              <History
                history={history.filter(
                  (item) => item.action === ACTIONS.train.title,
                )}
                storageError={storageError}
              />
            </>
          )}

          {view === "operations" && (
            <>
              <Panel
                title="Service health"
                subtitle="Use Refresh data to check the services on demand"
              >
                <p>
                  Core → ML:{" "}
                  {isStale("status") || !status?.ml
                    ? "Unknown"
                    : status.ml.ok
                      ? "Authenticated"
                      : status.ml.error || "Unavailable"}
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Observation</th>
                        <th>Last success</th>
                        <th>Latest error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(endpoints) as Endpoint[]).map((key) => (
                        <tr key={key}>
                          <td>
                            <strong>{key}</strong>
                          </td>
                          <td>
                            <Badge
                              tone={
                                isStale(key)
                                  ? endpoints[key].lastSuccess
                                    ? "warn"
                                    : "muted"
                                  : "good"
                              }
                            >
                              {isStale(key)
                                ? endpoints[key].lastSuccess
                                  ? "Stale"
                                  : "Unavailable"
                                : "Fresh"}
                            </Badge>
                            {key === "ready" && ready && (
                              <small className="cell-note">
                                Ready:{" "}
                                {ready.reason === "idle"
                                  ? "Idle · awaiting scan"
                                  : yesNo(ready.ready)}
                              </small>
                            )}
                            {key === "mlReady" && mlReady && (
                              <small className="cell-note">
                                Ready: {yesNo(mlReady.ready)}
                              </small>
                            )}
                          </td>
                          <td>{timestamp(endpoints[key].lastSuccess)}</td>
                          <td className="error-cell">
                            {endpoints[key].error || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="footnote">
                  Receipt timestamps measure dashboard requests. Market-data and
                  account-sync freshness require timestamps from Core. Polls
                  pause while this tab is hidden.
                </p>
              </Panel>
              <div className="two-columns">
                <Panel
                  title="Operator controls"
                  subtitle={
                    operator
                      ? "Session unlocked · actions are recorded on this device"
                      : "Unlock a session to submit privileged requests"
                  }
                  aside={<LockKeyhole size={18} />}
                >
                  {operatorConfigured === false && (
                    <p className="footnote negative">
                      Operator access is not configured. Set
                      DASHBOARD_OPERATOR_KEY on the dashboard runtime to at
                      least 32 random characters.
                    </p>
                  )}
                  <div className="control-list">
                    {actionButton("scan", "Request scan")}
                    {actionButton("train", "Run autonomy training")}
                    {actionButton(
                      "clear-hard-flat",
                      "Clear hard-flat / degraded",
                    )}
                    {actionButton("clear-blacklist", "Clear symbol cooldowns")}
                  </div>
                  <p className="footnote">
                    Clearing a flag does not reconcile an order or resolve its
                    underlying cause. Core’s pending-order guard remains
                    authoritative.
                  </p>
                </Panel>
                <Panel
                  title="Reconciliation and persistence"
                  subtitle="Reported service state"
                >
                  <dl className="detail-list">
                    <div>
                      <dt>Hard flat</dt>
                      <dd>{yesNo(status?.hardFlat)}</dd>
                    </div>
                    <div>
                      <dt>Degraded</dt>
                      <dd>{yesNo(status?.degraded)}</dd>
                    </div>
                    <div>
                      <dt>Broker error</dt>
                      <dd>{status?.brokerError || "None reported"}</dd>
                    </div>
                    <div>
                      <dt>Pending order ID</dt>
                      <dd>{status?.coinbasePendingOrderId || "Not exposed"}</dd>
                    </div>
                    <div>
                      <dt>ML lifecycle persistence</dt>
                      <dd>{yesNo(ml?.lifecycle?.persistEnabled)}</dd>
                    </div>
                  </dl>
                  <JsonDetails
                    label="ML readiness checks"
                    value={mlReady?.checks}
                  />
                </Panel>
              </div>
              <History history={history} storageError={storageError} />
              <Panel
                title="Core log feed"
                subtitle="The current backend may return only an API-online heartbeat"
                aside={
                  <label className="search-label">
                    Filter logs
                    <input
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      placeholder="Search messages…"
                    />
                  </label>
                }
              >
                {freshness("logs")}
                <div className="log-feed">
                  {logs
                    .filter((log) =>
                      (typeof log === "string"
                        ? log
                        : `${log.level} ${log.message}`
                      )
                        .toLowerCase()
                        .includes(logFilter.toLowerCase()),
                    )
                    .map((log, index) => (
                      <div key={index}>
                        {typeof log === "string" ? (
                          log
                        ) : (
                          <>
                            <time>{timestamp(log.timestamp)}</time>
                            <span
                              className={
                                log.level === "ERROR"
                                  ? "negative"
                                  : log.level === "WARN"
                                    ? "warning"
                                    : "positive"
                              }
                            >
                              {log.level}
                            </span>
                            <span>{log.message}</span>
                          </>
                        )}
                      </div>
                    ))}
                  {!logs.length && <Empty>No logs available.</Empty>}
                </div>
              </Panel>
            </>
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} /> AlphaStream · Coinbase equities
            </span>
            <span>
              Auto-refresh 30s · Times in your locale unless marked ET or UTC
            </span>
          </footer>
        </main>
      </div>
      {(unlock || confirm) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!busy) {
              setUnlock(false);
              setConfirm(null);
              setPassword("");
            }
          }}
        >
          <dialog
            ref={dialogRef}
            className="modal"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onCancel={(event) => {
              event.preventDefault();
              if (!busy) {
                setUnlock(false);
                setConfirm(null);
                setPassword("");
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-heading">
              <h2 id="dialog-title">
                {unlock ? "Unlock operator controls" : ACTIONS[confirm!].title}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                disabled={busy}
                onClick={() => {
                  setUnlock(false);
                  setConfirm(null);
                  setPassword("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            {unlock ? (
              <form onSubmit={signIn}>
                <p className="body-copy">
                  Use the dashboard’s operator key. Your session is stored in an
                  HttpOnly cookie and expires after 8 hours.
                </p>
                <label className="field-label">
                  Operator key
                  <input
                    autoFocus
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {notice?.error && (
                  <p className="negative" role="alert">
                    {notice.message}
                  </p>
                )}
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={busy || !password}
                >
                  {busy ? "Unlocking…" : "Unlock controls"}
                </button>
              </form>
            ) : (
              <>
                <p className="body-copy">{ACTIONS[confirm!].description}</p>
                <div className="modal-actions">
                  <button
                    autoFocus
                    className="button"
                    disabled={busy}
                    onClick={() => setConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="button button-primary"
                    disabled={busy}
                    onClick={() => void execute(confirm!)}
                  >
                    {busy ? "Submitting…" : "Confirm request"}
                  </button>
                </div>
              </>
            )}
          </dialog>
        </div>
      )}
    </div>
  );
}
