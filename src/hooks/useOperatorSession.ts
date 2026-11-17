"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { apiFetch } from "@/services/alphastream";

export function useOperatorSession() {
  const revision = useRef(0);
  const changing = useRef(false);
  const [operator, setOperator] = useState(false);
  const [operatorConfigured, setOperatorConfigured] = useState<boolean | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let pending = false;
    async function check() {
      if (pending || changing.current) return;
      pending = true;
      const current = revision.current;
      try {
        const value = await apiFetch<{
          authenticated: boolean;
          configured: boolean;
        }>("/api/session", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(20_000),
          ]),
        });
        if (
          typeof value?.authenticated !== "boolean" ||
          typeof value?.configured !== "boolean"
        )
          throw new Error("Invalid session response");
        if (active && current === revision.current) {
          setOperator(value.authenticated);
          setOperatorConfigured(value.configured);
        }
      } catch {
        if (active && current === revision.current) {
          setOperator(false);
          setOperatorConfigured(null);
        }
      } finally {
        pending = false;
      }
    }
    void check();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, 60_000);
    const visible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  const signIn = useCallback(async (password: string) => {
    revision.current++;
    changing.current = true;
    try {
      await apiFetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setOperator(true);
      setOperatorConfigured(true);
    } finally {
      changing.current = false;
    }
  }, []);
  const signOut = useCallback(async () => {
    revision.current++;
    changing.current = true;
    try {
      await apiFetch("/api/session", { method: "DELETE" });
      setOperator(false);
    } finally {
      changing.current = false;
    }
  }, []);
  return { operator, operatorConfigured, setOperator, signIn, signOut };
}
