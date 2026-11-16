# AlphaStream dashboard

Next.js operations dashboard for the Go Core and Python ML services in `../alphastream-2025`. It supports the Coinbase MAG7 equity refactor and preserves compatibility with older telemetry by displaying unavailable fields explicitly.

## Development

Use Node.js 22.6+ (Node 22 recommended; tests use built-in TypeScript stripping).

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

`next dev` reads `.env.local`; Cloudflare Pages uses runtime bindings. Configure:

```dotenv
CORE_URL=https://your-core-service
ML_URL=https://your-ml-service
ADMIN_KEY=your-core-service-key
ML_ADMIN_KEY=your-ml-service-key
DASHBOARD_OPERATOR_KEY=a-separate-random-secret-of-at-least-32-characters
```

Never use a `NEXT_PUBLIC_` prefix for service or operator keys. `ML_ADMIN_KEY` falls back to `ADMIN_KEY`. Existing Core/ML URL defaults are retained; set explicit URLs for each environment. Use deployment secrets for credentials. No credential values are committed by this update.

## Views

- **Overview:** execution readiness, broker errors, equity, capital, schedule, latest executed decision.
- **MAG7:** seven-stock ownership board and latest successful entry; missing scanner diagnostics are explicit.
- **Portfolio:** fractional quantities, allocation, available-to-sell shares and risk fields when reported.
- **Performance:** symbol/date filters, realized PnL, consistent breakeven counts, payoff ratio, exit mix, full retained ledger and CSV.
- **Models:** direct ML status, policy mismatch reporting, registry/challenger results, watchdog, readiness and persistence observations.
- **Operations:** endpoint health/freshness, recovery controls, local request history and Core log feed.

Each endpoint refreshes independently every 30 seconds while the tab is visible. Returning to the tab requests a refresh. Requests have timeouts; concurrent refreshes share one in-flight cycle. Failed requests retain the previous value and mark it stale. Successful receipt older than 60 seconds is also stale. A valid 503 readiness body is shown as a not-ready observation rather than a transport failure. Dashboard receipt time is not market-data freshness.

## Operator access

All existing mutation proxies require a same-origin request and an authenticated operator cookie. Use **Operator access** to sign in with `DASHBOARD_OPERATOR_KEY`. Sessions last up to eight hours and are HMAC-signed, HttpOnly, SameSite=Strict and Secure over HTTPS. Signing out removes the cookie; rotating the key invalidates existing sessions. Mutations fail closed when the key is missing or shorter than 32 characters. Upstream ADMIN_KEY values stay server-side.

Read endpoints remain accessible to visitors who can reach the dashboard. For a private financial dashboard, restrict the entire deployment using your hosting access policy (for example Cloudflare Access), including `/api/*`, and configure login rate limits at the edge. This local update does not configure a hosting access policy or provide multi-user identity and server audit storage.

Scan and training actions request work from existing service endpoints. A scan response confirms request acceptance, not completion or an order fill. An uncertain request should be reconciled before manually retrying. Recovery controls display upstream failures, including Core's pending-order conflict. Actions require confirmation. Browser request history is retained locally (up to 50 records) and is not an authoritative server audit.

## Telemetry limits

The current Core API exposes `/ready`, broker status, trading enablement, universe and long-only policy. It does not yet expose mode flags, venue session state, last account sync, pending order ID, per-symbol candidate/hold/rejection history, quote/candle timestamps, complete position risk metadata, or durable equity snapshots. Optional UI fields will display these when supplied; unavailable data is never replaced with default risk values or fabricated predictions.

The backend ML status currently reports `longOnly=false` despite Core's long-only execution policy. This dashboard surfaces the contradiction; the backend contract still needs correction. Direct ML status takes precedence over Core's abbreviated ML block. Model readiness does not establish trained weights or profitable strategy validation. Replay evaluation is labeled as diagnostic evidence.

Core retains up to 500 closed trades. Analytics describe only retained, filtered records. Invalid or missing PnL is excluded from outcome statistics. Breakeven trades count in the win-rate denominator and outcome chart. UTC date filters include both selected calendar dates. The cumulative realized PnL chart starts at zero; it does not reconstruct account equity. Core's reported realized PnL is not reduced by fees again; the separate fees column contains the exit fees exposed by Core. CSV exports retain fractional quantities and neutralize formula-like text.

The logs proxy uses Core's required `x-admin-key` via `coreFetch`. The current backend log route may return only an online heartbeat; a durable event/log feed requires backend work.

## Cloudflare Pages

```sh
npm run pages:build
```

The existing workflow deploys pushes to `main`/`master`. Configure runtime bindings in Cloudflare, including the new operator key, before using mutation controls. This source update does not deploy or change the backend.

## Verification of this update

Validated with Node 22: TypeScript checks, five focused assertions/tests across performance and session-token suites, a production build, and Cloudflare Pages packaging. Local fixture integration checks covered readiness 503 bodies, logs authentication, all mutation guards, origin checks, login/logout cookies, accepted scan requests and recovery conflicts. Headless Chrome checks covered desktop/mobile layout, navigation, filters, direct ML status precedence, policy mismatch reporting, operator login, recovery errors and stale-data retention without runtime exceptions. Fixture tests did not contact live trading services. Temporary preview services were stopped after validation.

Next.js and its ESLint config were updated from 15.5.2 to 15.5.29. Dependency installation still reports 17 audit findings elsewhere in the dependency tree. The existing next-on-pages adapter is deprecated; migration and remaining dependency remediation need a separate compatibility review. No live deployment was performed.


## Coinbase setup from the dashboard

Open **Coinbase setup** and unlock **Operator access**. Import the CDP JSON download or a PEM file, find/select the permissioned portfolio, and confirm **Save credentials**. The private key is kept only in the current form until sent through the authenticated same-origin proxy to Core; it is never saved in browser storage or returned by the status API. Successful saving clears the form. Core stores a single atomic credential bundle in Google Secret Manager.

For first-time setup, inactive Core retries initialization and picks up the saved bundle. **Reconnect Core in read-only mode** requests a graceful Core restart to apply rotations; it does not enable orders. A warm Cloud Run instance is required for automatic replacement. **Run read-only checks** verifies portfolio access, MAG7 equity discovery, fresh trades and daily history; results are polled and tied to the saved credential fingerprint. Run market-data checks during the normal equity session. No setup action can enable live trading.

One-time cloud administrator setup:

1. Create a versionless Secret Manager secret `alphastream-coinbase-credentials` in the Core project (for example `gcloud secrets create alphastream-coinbase-credentials --replication-policy=automatic --project=alphastream-2025`). Do not upload the Coinbase key through Cloudflare.
2. Grant Core's runtime service account **Secret Manager Secret Accessor** and **Secret Manager Secret Version Adder** on that single secret.
3. Set Core environment variable `COINBASE_CREDENTIALS_SECRET=projects/alphastream-2025/secrets/alphastream-coinbase-credentials`. If deploying through the Core workflow, set the repository variable of the same name too.
4. Deploy the matching Core and dashboard updates. Keep `ENTRIES_DISABLED=true`, `LIVE_TRADING_ENABLED=false`, and `PAPER_TRADING_ENABLED=true`. Existing dashboard operator/service secrets are still required.

The screen shows a setup prerequisite when Core storage is not configured and rejects unsupported older Core responses. Coinbase setup routes require operator authentication even for status, plus same-origin protection for mutations. Bodies are capped at 16 KB. The proxy forwards only known credential fields to a configured HTTPS Core URL and returns only masked status/acknowledgments. Secrets, request bodies, and uploaded file contents are not logged. An account connection or passing read-only checks does not qualify a strategy for live operation.
