"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  FileKey,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { useCoinbaseStatus } from "@/hooks/useCoinbaseStatus";
import {
  parsePortfolios,
  type CoinbasePortfolio as Portfolio,
  type CoinbaseVerification,
} from "@/lib/validation";
import { apiFetch } from "@/services/alphastream";
import {
  MAX_CREDENTIAL_FILE_BYTES,
  parseCredentialFile,
  validateCredentialDraft,
  type CredentialDraft,
} from "@/lib/coinbase-credentials";

const empty: CredentialDraft = { keyName: "", privateKey: "", portfolioId: "" };

export function CoinbaseConnection({
  operator,
  onUnlock,
}: {
  operator: boolean;
  onUnlock: () => void;
}) {
  const {
    status,
    stale,
    error: statusError,
    lastSuccess,
    refreshing,
    refresh,
  } = useCoinbaseStatus(operator);
  const [draft, setDraft] = useState<CredentialDraft>(empty);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [fileName, setFileName] = useState("");
  const [paste, setPaste] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [confirmSave, setConfirmSave] = useState(false);
  const [latestVerification, setLatestVerification] =
    useState<CoinbaseVerification>();
  const input = useRef<HTMLInputElement>(null);
  const draftGeneration = useRef(0);
  const mounted = useRef(true);
  const sessionGeneration = useRef(0);
  useEffect(() => {
    draftGeneration.current++;
    sessionGeneration.current++;
    mounted.current = true;
    setBusy("");
    if (!operator) {
      draftGeneration.current++;
      setDraft(empty);
      setFileName("");
      setPortfolios([]);
      setShowKey(false);
      setPaste(false);
      setConfirmSave(false);
      setNotice(null);
      setLatestVerification(undefined);
      if (input.current) input.current.value = "";
    }
    return () => {
      mounted.current = false;
    };
  }, [operator]);
  const setupAvailable =
    !stale &&
    !!status?.storageConfigured &&
    status.readOnly &&
    !status.storageError;
  function clearDraft() {
    draftGeneration.current++;
    setDraft(empty);
    setFileName("");
    setPortfolios([]);
    setShowKey(false);
    setPaste(false);
    setConfirmSave(false);
    if (input.current) input.current.value = "";
  }
  async function readFile(file?: File) {
    if (!file || !setupAvailable || busy) return;
    clearDraft();
    const generation = draftGeneration.current;
    try {
      if (file.size > MAX_CREDENTIAL_FILE_BYTES)
        throw new Error("Choose a file smaller than 16 KB.");
      const parsed = parseCredentialFile(await file.text());
      if (!mounted.current || generation !== draftGeneration.current) return;
      setDraft((old) => ({ ...old, ...parsed }));
      setFileName(file.name);
      setNotice(null);
      setConfirmSave(false);
    } catch (error) {
      if (!mounted.current || generation !== draftGeneration.current) return;
      setNotice({ text: (error as Error).message, error: true });
      if (input.current) input.current.value = "";
    }
  }
  async function findPortfolios() {
    if (!setupAvailable || busy) return;
    const generation = draftGeneration.current;
    const error = validateCredentialDraft(draft, false);
    if (error) {
      setNotice({ text: error, error: true });
      return;
    }
    const session = sessionGeneration.current;
    setBusy("portfolios");
    setNotice(null);
    try {
      const result = parsePortfolios(
        await apiFetch<unknown>("/api/coinbase/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: AbortSignal.timeout(30_000),
        }),
      );
      if (!mounted.current || generation !== draftGeneration.current) return;
      setPortfolios(result.portfolios);
      if (result.portfolios.length === 1)
        setDraft((old) => ({ ...old, portfolioId: result.portfolios[0].uuid }));
    } catch (error) {
      if (!mounted.current || session !== sessionGeneration.current) return;
      setNotice({ text: (error as Error).message, error: true });
    } finally {
      if (mounted.current && session === sessionGeneration.current) setBusy("");
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!setupAvailable || busy) return;
    const error = validateCredentialDraft(draft);
    if (error) {
      setNotice({ text: error, error: true });
      return;
    }
    if (!confirmSave) {
      setConfirmSave(true);
      return;
    }
    const session = sessionGeneration.current;
    setBusy("save");
    setNotice(null);
    try {
      await apiFetch("/api/coinbase/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyName: draft.keyName.trim(),
          privateKey: draft.privateKey.trim(),
          portfolioId: draft.portfolioId.trim(),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!mounted.current || session !== sessionGeneration.current) return;
      clearDraft();
      setNotice({
        text: "Credentials saved securely. Core will pick up first-time credentials automatically; use Reconnect to apply a rotation. Trading remains disabled.",
        error: false,
      });
      await refresh();
    } catch (error) {
      if (!mounted.current || session !== sessionGeneration.current) return;
      setNotice({ text: (error as Error).message, error: true });
    } finally {
      if (mounted.current && session === sessionGeneration.current) setBusy("");
    }
  }
  async function act(action: "verify" | "reconnect") {
    if (!setupAvailable || !status?.saved || busy) return;
    const session = sessionGeneration.current;
    setBusy(action);
    setNotice(null);
    try {
      const result = await apiFetch<{ verification?: CoinbaseVerification }>(
        `/api/coinbase/${action}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(action === "verify" ? 125_000 : 40_000),
        },
      );
      if (!mounted.current || session !== sessionGeneration.current) return;
      if (result.verification) setLatestVerification(result.verification);
      setNotice({
        text:
          action === "verify"
            ? result.verification
              ? "Read-only checks finished. Review the results below."
              : "Read-only checks started. Results update automatically."
            : "Core is restarting to load the saved credentials. Connection status will recover automatically.",
        error: false,
      });
      await refresh();
    } catch (error) {
      if (!mounted.current || session !== sessionGeneration.current) return;
      setNotice({ text: (error as Error).message, error: true });
    } finally {
      if (mounted.current && session === sessionGeneration.current) setBusy("");
    }
  }
  const applied =
    !!status?.saved &&
    !!status.fingerprint &&
    status.fingerprint === status.activeFingerprint;
  const verification =
    latestVerification?.fingerprint === status?.fingerprint &&
    latestVerification?.completedAt &&
    latestVerification.completedAt >= (status?.verification?.completedAt ?? "")
      ? latestVerification
      : status?.verification;
  const checks =
    verification?.fingerprint === status?.fingerprint
      ? (verification?.checks ?? [])
      : [];
  const failed = checks.some((check) => !check.ok);
  return (
    <div className="coinbase-connection">
      <section className="cb-intro">
        <div className="cb-mark" aria-hidden="true">
          C
        </div>
        <div>
          <p className="eyebrow">BROKER CONNECTION</p>
          <h2>Connect your Coinbase account</h2>
          <p>
            Upload your key once. Keep your portfolio and connection checks in
            one place.
          </p>
        </div>
        <span className="badge badge-good">
          <ShieldCheck size={13} /> Read-only setup
        </span>
      </section>
      <div className="cb-steps" aria-label="Connection progress">
        {[
          { title: "Secure storage", done: !!status?.saved },
          {
            title: "Core connection",
            done: !stale && !!applied && !!status?.connected,
          },
          {
            title: "Read-only checks",
            done:
              !stale &&
              !verification?.running &&
              !!verification?.completedAt &&
              checks.length === 16 &&
              !failed,
          },
        ].map((step, index) => (
          <div key={step.title} className={step.done ? "complete" : ""}>
            {step.done ? (
              <CheckCircle2 size={19} />
            ) : (
              <span className="cb-step-number">{index + 1}</span>
            )}
            <span>{step.title}</span>
          </div>
        ))}
      </div>
      {!operator ? (
        <section className="panel cb-locked">
          <LockKeyhole size={30} />
          <h2>Operator access required</h2>
          <p>
            Unlock your operator session to upload credentials and view
            connection details.
          </p>
          <button className="button button-primary" onClick={onUnlock}>
            Unlock operator access
          </button>
        </section>
      ) : (
        <>
          {statusError && (
            <div className="notice notice-error" role="alert">
              {statusError} Connection status is stale; refresh before
              continuing.
            </div>
          )}
          {!statusError && stale && status && (
            <div className="notice notice-error" role="status">
              Connection status is stale; refresh before continuing.
            </div>
          )}
          {notice && (
            <div
              role={notice.error ? "alert" : "status"}
              className={`notice ${notice.error ? "notice-error" : "notice-success"}`}
            >
              {notice.text}
            </div>
          )}
          {status && (!status.storageConfigured || status.storageError) && (
            <section className="cb-prerequisite">
              <ShieldCheck size={22} />
              <div>
                <h3>One-time cloud setup needed</h3>
                <p>
                  {status.storageError ||
                    "Create the Coinbase credential secret and connect it to Core. Then you can upload and rotate keys here."}
                </p>
                <details>
                  <summary>Show administrator setup</summary>
                  <p>
                    Create an empty Secret Manager secret named{" "}
                    <code>alphastream-coinbase-credentials</code>. Give Core’s
                    runtime service account Secret Accessor and Secret Version
                    Adder on that secret. Set this Core environment variable:
                  </p>
                  <code>
                    COINBASE_CREDENTIALS_SECRET=projects/alphastream-2025/secrets/alphastream-coinbase-credentials
                  </code>
                  <p>
                    Deploy the updated Core and dashboard. No Coinbase key
                    belongs in the dashboard hosting environment.
                  </p>
                </details>
              </div>
            </section>
          )}
          {status && !status.readOnly && (
            <div className="notice notice-error" role="alert">
              Credential changes require Core’s live trading to be off,
              paper/read-only mode on, and entries disabled.
            </div>
          )}
          <div className="cb-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {status?.saved
                      ? "Replace credentials"
                      : "Add API credentials"}
                  </h2>
                  <p>Coinbase CDP · ECDSA P-256 · MAG7 equities</p>
                </div>
                <KeyRound size={19} />
              </div>
              <form onSubmit={save} autoComplete="off">
                <fieldset disabled={!setupAvailable || !!busy}>
                  <label
                    className="cb-upload"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!busy && setupAvailable)
                        void readFile(event.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      ref={input}
                      type="file"
                      accept=".json,.pem,application/json,application/x-pem-file"
                      onChange={(event) =>
                        void readFile(event.target.files?.[0])
                      }
                    />
                    <span className="cb-upload-icon">
                      {fileName ? <FileKey size={23} /> : <Upload size={23} />}
                    </span>
                    <strong>
                      {fileName || "Choose or drop your key file"}
                    </strong>
                    <span>
                      {fileName
                        ? "Private key loaded into this form only"
                        : "Coinbase JSON export or PEM · up to 16 KB"}
                    </span>
                  </label>
                  <div className="cb-field">
                    <label htmlFor="cb-key-name">API key identifier</label>
                    <input
                      id="cb-key-name"
                      autoComplete="off"
                      value={draft.keyName}
                      onChange={(event) => {
                        setDraft({ ...draft, keyName: event.target.value });
                        setConfirmSave(false);
                      }}
                      placeholder="organizations/…/apiKeys/…"
                    />
                  </div>
                  <button
                    type="button"
                    className="cb-text-button"
                    onClick={() => setPaste(!paste)}
                  >
                    {paste
                      ? "Hide private-key input"
                      : "Paste a private key instead"}
                  </button>
                  {paste && (
                    <div className="cb-field">
                      <label htmlFor="cb-private-key">Private key</label>
                      {showKey ? (
                        <textarea
                          id="cb-private-key"
                          autoComplete="off"
                          spellCheck={false}
                          value={draft.privateKey}
                          onChange={(event) => {
                            setDraft({
                              ...draft,
                              privateKey: event.target.value,
                            });
                            setConfirmSave(false);
                          }}
                          placeholder="-----BEGIN EC PRIVATE KEY-----"
                          rows={4}
                        />
                      ) : (
                        <input
                          id="cb-private-key"
                          type="password"
                          autoComplete="off"
                          value={draft.privateKey.replace(/\n/g, "\\n")}
                          onPaste={(event) => {
                            event.preventDefault();
                            setDraft({
                              ...draft,
                              privateKey: event.clipboardData.getData("text"),
                            });
                            setConfirmSave(false);
                          }}
                          onChange={(event) => {
                            setDraft({
                              ...draft,
                              privateKey: event.target.value.replace(
                                /\\n/g,
                                "\n",
                              ),
                            });
                            setConfirmSave(false);
                          }}
                          placeholder="Paste complete PEM private key"
                        />
                      )}
                      <label className="cb-show-key">
                        <input
                          type="checkbox"
                          checked={showKey}
                          onChange={(event) => setShowKey(event.target.checked)}
                        />{" "}
                        Show private key temporarily
                      </label>
                    </div>
                  )}
                  {!paste && draft.privateKey && (
                    <p className="cb-loaded">
                      <Check size={14} /> Private key loaded · contents hidden
                    </p>
                  )}
                  <div className="cb-field">
                    <div className="cb-field-heading">
                      <label htmlFor="cb-portfolio">Portfolio</label>
                      <button
                        type="button"
                        className="cb-text-button"
                        disabled={!draft.keyName || !draft.privateKey || !!busy}
                        onClick={() => void findPortfolios()}
                      >
                        {busy === "portfolios"
                          ? "Finding…"
                          : "Find my portfolios"}
                      </button>
                    </div>
                    {portfolios.length ? (
                      <select
                        id="cb-portfolio"
                        value={draft.portfolioId}
                        onChange={(event) => {
                          setDraft({
                            ...draft,
                            portfolioId: event.target.value,
                          });
                          setConfirmSave(false);
                        }}
                      >
                        <option value="">Select a Coinbase portfolio</option>
                        {portfolios.map((portfolio) => (
                          <option key={portfolio.uuid} value={portfolio.uuid}>
                            {portfolio.name || "Portfolio"} · {portfolio.uuid}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="cb-portfolio"
                        autoComplete="off"
                        value={draft.portfolioId}
                        onChange={(event) => {
                          setDraft({
                            ...draft,
                            portfolioId: event.target.value,
                          });
                          setConfirmSave(false);
                        }}
                        placeholder="Portfolio UUID, or find it using your key"
                      />
                    )}
                  </div>
                  {confirmSave && (
                    <div className="cb-confirm" role="status">
                      {status?.saved
                        ? "This creates a new secret version and replaces the credentials used on the next connection."
                        : "Your key will be encrypted in Secret Manager and used only by Core."}{" "}
                      Trading stays disabled. Click again to confirm.
                    </div>
                  )}
                  <div className="cb-form-actions">
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={!draft.privateKey || !!busy}
                    >
                      {busy === "save" ? (
                        <Loader2 className="spin" size={15} />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                      {busy === "save"
                        ? "Saving securely…"
                        : confirmSave
                          ? "Confirm secure save"
                          : "Save credentials"}
                    </button>
                    <button
                      className="button"
                      type="button"
                      onClick={clearDraft}
                    >
                      Clear form
                    </button>
                  </div>
                </fieldset>
              </form>
              <p className="cb-security-note">
                <ShieldCheck size={14} /> Credentials are sent through your
                authenticated dashboard to Core. Saved keys are never returned
                to this form or stored in browser storage.
              </p>
            </section>
            <div className="cb-side">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Connection status</h2>
                    <p>
                      {lastSuccess
                        ? `Last checked ${new Date(lastSuccess).toLocaleTimeString()}`
                        : "Waiting for connection status"}
                    </p>
                  </div>
                  <button
                    className="button"
                    onClick={() => void refresh()}
                    disabled={refreshing}
                    aria-label="Refresh Coinbase connection"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="cb-status-head">
                  <span
                    className={`cb-status-orb ${!stale && status?.connected && applied ? "connected" : ""}`}
                  />
                  <strong>
                    {stale && status
                      ? "Connection status stale"
                      : !stale && status?.connected && applied
                        ? status.readOnly
                          ? "Connected · read-only"
                          : "Connected · setup locked"
                        : status?.saved
                          ? "Credentials saved"
                          : status
                            ? "Not connected"
                            : "Loading connection…"}
                  </strong>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Stored key</dt>
                    <dd>{status?.maskedKey || "No key saved"}</dd>
                  </div>
                  <div>
                    <dt>Portfolio</dt>
                    <dd className="cb-uuid">
                      {status?.portfolioId || "Not selected"}
                    </dd>
                  </div>
                  <div>
                    <dt>Credential version</dt>
                    <dd>
                      {status?.fingerprint
                        ? `${status.fingerprint.slice(0, 8)}…`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Applied to Core</dt>
                    <dd>
                      {stale
                        ? "Unknown · stale"
                        : applied
                          ? "Yes"
                          : status?.saved
                            ? "Awaiting connection"
                            : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Order submission</dt>
                    <dd className="cb-order-disabled">
                      {stale
                        ? "Unknown · stale"
                        : status?.readOnly
                          ? "Disabled"
                          : "Check Core mode"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="button cb-full"
                  disabled={!setupAvailable || !status?.saved || !!busy}
                  onClick={() => void act("reconnect")}
                >
                  {busy === "reconnect"
                    ? "Reconnecting…"
                    : "Reconnect Core in read-only mode"}
                </button>
                {status?.brokerError && (
                  <p className="cb-inline-error">{status.brokerError}</p>
                )}
              </section>
              <section className="panel cb-safety">
                <ShieldCheck size={20} />
                <h3>Your key stays on the execution service</h3>
                <p>
                  ML and the browser never receive the saved private key. Setup
                  uses account and market-data reads; it cannot enable live
                  orders.
                </p>
                <p>
                  Use an ECDSA P-256 key with view permission for the initial
                  check.
                </p>
              </section>
            </div>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Read-only verification</h2>
                <p>
                  Checks account access, seven equity listings, fresh trades and
                  61 completed daily candles. Run during the normal equity
                  session.
                </p>
              </div>
              <button
                className="button"
                disabled={
                  !setupAvailable ||
                  !status?.saved ||
                  !!busy ||
                  verification?.running
                }
                onClick={() => void act("verify")}
              >
                {verification?.running ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <ShieldCheck size={15} />
                )}
                {verification?.running ? "Checking…" : "Run read-only checks"}
              </button>
            </div>
            {checks.length ? (
              <ul className="cb-checks">
                {checks.map((check, index) => (
                  <li
                    key={`${index}-${check.name}`}
                    className={check.ok ? "passed" : "failed"}
                  >
                    {check.ok ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <XCircle size={17} />
                    )}
                    <div>
                      <strong>{check.name}</strong>
                      <span>{check.message}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="cb-check-empty">
                <Circle size={18} />
                <span>
                  No verification yet. No orders are placed by these checks.
                </span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
