import { z } from "zod";
import {
  coinbaseStatusSchema,
  coinbaseVerificationSchema,
  portfoliosSchema,
} from "@/lib/validation";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";
import { validateCredentialDraft } from "@/lib/coinbase-credentials";
import { coreFetch, getRuntimeConfig } from "@/lib/core";
import { operatorSession, requireOperator } from "@/lib/operator";
export const runtime = "edge";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
const actions = new Set(["credentials", "portfolios", "verify", "reconnect"]);
const credentialInput = z.object({
  keyName: z.string(),
  privateKey: z.string(),
  portfolioId: z.string().default(""),
});
const acknowledgment = z
  .object({
    ok: z.boolean().optional(),
    saved: z.boolean().optional(),
    version: z.union([z.string(), z.number()]).optional(),
    fingerprint: z.string().optional(),
    maskedKey: z.string().optional(),
    restarting: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.ok !== undefined ||
      value.saved !== undefined ||
      value.restarting !== undefined,
  );
function safeResponse(data: unknown, action: string) {
  if (action === "portfolios") return portfoliosSchema.parse(data);
  if (action === "verify")
    return acknowledgment
      .and(z.object({ verification: coinbaseVerificationSchema.optional() }))
      .parse(data);
  if (action) return acknowledgment.parse(data);
  // Replace storage diagnostics before schema parsing so raw backend details never escape.
  const input =
    data && typeof data === "object"
      ? ({ ...data } as Record<string, unknown>)
      : {};
  if (input.storageError)
    input.storageError =
      "Core cannot access credential storage. Check the secret resource and service-account permissions.";
  return coinbaseStatusSchema.parse(input);
}
async function proxy(
  request: Request,
  context: { params: Promise<{ action?: string[] }> },
) {
  if (request.method === "GET") {
    if (!(await operatorSession(request)))
      return Response.json(
        { error: "Unlock operator access to view Coinbase setup." },
        { status: 401, headers },
      );
  } else {
    const denied = await requireOperator(request);
    if (denied) return denied;
  }
  const segments = (await context.params).action ?? [];
  const action = segments.join("/");
  if (
    (request.method === "GET" && segments.length) ||
    (request.method === "POST" && !actions.has(action))
  )
    return Response.json(
      { error: "Unknown Coinbase setup action" },
      { status: 404, headers },
    );
  try {
    const target = new URL(getRuntimeConfig().coreUrl);
    if (
      target.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        ["127.0.0.1", "localhost"].includes(target.hostname)
      )
    )
      throw new Error("HTTPS required");
    if (target.username || target.password || target.search || target.hash)
      throw new Error("Invalid Core URL");
  } catch {
    return Response.json(
      { error: "Credential setup requires a valid HTTPS Core URL." },
      { status: 503, headers },
    );
  }
  let body: string | undefined;
  if (
    request.method === "POST" &&
    ["credentials", "portfolios"].includes(action)
  ) {
    try {
      const input = credentialInput.safeParse(
        await readJsonBody(request, 16 * 1024),
      );
      if (!input.success)
        return Response.json(
          { error: "Invalid credential request." },
          { status: 400, headers },
        );
      const draft = {
        keyName: input.data.keyName.trim(),
        privateKey: input.data.privateKey.trim(),
        portfolioId: input.data.portfolioId.trim(),
      };
      const error = validateCredentialDraft(draft, action === "credentials");
      if (error) return Response.json({ error }, { status: 422, headers });
      body = JSON.stringify(draft);
    } catch (error) {
      return Response.json(
        { error: "Invalid credential request." },
        {
          status: error instanceof RequestBodyError ? error.status : 400,
          headers,
        },
      );
    }
  }
  try {
    const upstream = await coreFetch(
      `/admin/coinbase${action ? `/${action}` : ""}`,
      {
        method: request.method,
        body,
        signal: AbortSignal.any([
          request.signal,
          AbortSignal.timeout(action === "verify" ? 120_000 : 35_000),
        ]),
      },
    );
    if (!upstream.ok) {
      const messages: Record<number, string> = {
        400: "Invalid credential request.",
        401: "Dashboard service authentication to Core failed.",
        404: "Deploy the updated Core service to enable dashboard setup.",
        409: "This action requires read-only mode and no conflicting verification request.",
        422: "Invalid credentials. Use the full CDP key identifier, ECDSA P-256 PEM, and valid portfolio UUID.",
        503: "Credential storage is unavailable. Complete the one-time Core secret/IAM setup.",
      };
      return Response.json(
        {
          error:
            messages[upstream.status] ??
            "Core could not complete the Coinbase setup request.",
        },
        { status: upstream.status, headers },
      );
    }
    const data: unknown = await upstream.json();
    return Response.json(safeResponse(data, action), {
      status: upstream.status,
      headers,
    });
  } catch {
    return Response.json(
      {
        error:
          "Core is unreachable or restarting. Refresh connection status shortly.",
      },
      { status: 502, headers },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
