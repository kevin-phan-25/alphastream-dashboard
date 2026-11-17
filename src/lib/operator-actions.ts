export type Action = "scan" | "train" | "clear-hard-flat" | "clear-blacklist";
export type ActionLog = {
  id: string;
  time: string;
  action: string;
  outcome: string;
  message: string;
};
export const HISTORY_KEY = "alphastream.operator-history.v1";
export const ACTIONS: Record<
  Action,
  { title: string; description: string; path: string }
> = {
  scan: {
    title: "Request a scan",
    description:
      "Core will request a trading cycle. Existing risk, session and entry checks still apply. A successful request does not confirm an order or a completed scan.",
    path: "/api/admin/scan",
  },
  train: {
    title: "Run autonomy training",
    description:
      "Request a training cycle. Depending on the configured challenger mode, this may update the serving model. Promotion is based on replay diagnostics.",
    path: "/api/ml/autonomy/train",
  },
  "clear-hard-flat": {
    title: "Clear trading halt",
    description:
      "Clear Core’s hard-flat and degraded flags. Reconcile uncertain orders first. Core will reject this request when a pending Coinbase order exists.",
    path: "/api/admin/clear-hard-flat",
  },
  "clear-blacklist": {
    title: "Clear symbol cooldowns",
    description:
      "Remove all symbol blacklists. This allows cooled-down stocks to be considered again when other entry checks pass.",
    path: "/api/admin/clear-blacklist",
  },
};
