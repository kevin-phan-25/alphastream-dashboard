"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/services/alphastream";
import { parseCoinbaseStatus, type CoinbaseStatus } from "@/lib/validation";
import { observationIsStale } from "@/lib/freshness";

export function useCoinbaseStatus(operator: boolean) {
  const [status, setStatus] = useState<CoinbaseStatus | null>(null);
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const active = useRef(false);
  const generation = useRef(0);
  const pending = useRef<{
    controller: AbortController;
    promise: Promise<void>;
  } | null>(null);

  const refresh = useCallback(() => {
    if (!operator || !active.current) return Promise.resolve();
    if (pending.current) return pending.current.promise;
    const current = generation.current;
    const controller = new AbortController();
    setRefreshing(true);
    const promise = (async () => {
      try {
        const next = parseCoinbaseStatus(
          await apiFetch<unknown>("/api/coinbase", {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(40_000),
            ]),
          }),
        );
        if (active.current && generation.current === current) {
          setStatus(next);
          setLastSuccess(Date.now());
          setNow(Date.now());
          setError(null);
        }
      } catch (cause) {
        if (
          active.current &&
          generation.current === current &&
          !controller.signal.aborted
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Connection status unavailable.",
          );
          setNow(Date.now());
        }
      } finally {
        if (active.current && generation.current === current) {
          pending.current = null;
          setRefreshing(false);
        }
      }
    })();
    pending.current = { controller, promise };
    return promise;
  }, [operator]);

  useEffect(() => {
    generation.current++;
    active.current = true;
    setStatus(null);
    setLastSuccess(null);
    setError(null);
    setRefreshing(false);
    setNow(Date.now());
    void refresh();
    const tick = window.setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    const visible = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active.current = false;

      pending.current?.controller.abort();
      pending.current = null;
      clearInterval(tick);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  const stale =
    !operator || observationIsStale(lastSuccess, error, now, 65_000);
  return { status, lastSuccess, error, stale, refreshing, refresh };
}
